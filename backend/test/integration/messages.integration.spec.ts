import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe('messages integration', () => {
  it('rejects invalid handoff payload', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await context.app.inject({
      method: 'POST',
      url: '/api/company/bootstrap',
      headers: { 'idempotency-key': 'bootstrap-msg' },
      payload: {
        company_name: 'Message Co',
        company_prompt: 'Need robust message workflow.',
        language: 'en',
      },
    });

    const response = await context.app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { 'idempotency-key': 'message-1' },
      payload: {
        thread_id: 'task-thread-1',
        message_type: 'handoff',
        sender_type: 'agent',
        content: 'handoff without structured payload',
        payload: { goal: 'missing required fields' },
      },
    });

    expect(response.statusCode).toBe(422);
  });

  it('returns messages in company state include and emits content excerpt in message.posted event', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await context.app.inject({
      method: 'POST',
      url: '/api/company/bootstrap',
      headers: { 'idempotency-key': 'bootstrap-msg-state' },
      payload: {
        company_name: 'Message Co',
        company_prompt: 'Need robust message workflow.',
        language: 'en',
      },
    });

    const agentsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/agents',
    });
    const senderAgentId = (agentsResponse.json().agents as Array<{ id: string }>)[0]?.id;
    expect(senderAgentId).toBeTruthy();

    const content = 'This is a deliberately long message intended to verify event content excerpt shaping in live payload.';
    const postMessage = await context.app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { 'idempotency-key': 'message-2' },
      payload: {
        thread_id: 'task-thread-2',
        message_type: 'task_comment',
        sender_type: 'agent',
        sender_agent_id: senderAgentId,
        content,
        payload: {},
      },
    });

    expect(postMessage.statusCode).toBe(201);

    const defaultState = await context.app.inject({
      method: 'GET',
      url: '/api/company/state',
    });
    expect(defaultState.statusCode).toBe(200);
    expect(defaultState.json().messages).toBeUndefined();

    const stateWithMessages = await context.app.inject({
      method: 'GET',
      url: '/api/company/state?include=agents,tasks,approvals,recent_events,runs,messages',
    });
    expect(stateWithMessages.statusCode).toBe(200);
    const stateWithMessagesJson = stateWithMessages.json();
    expect(stateWithMessagesJson.messages.length).toBeGreaterThan(0);
    expect(stateWithMessagesJson.messages[0].content).toBe(content);

    const eventsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/events',
    });
    expect(eventsResponse.statusCode).toBe(200);
    const events = eventsResponse.json().events as Array<{
      eventType: string;
      payload: { content_excerpt?: string; sender_agent_id?: string | null };
    }>;

    const messageEvent = events.find((event) => event.eventType === 'message.posted');
    expect(messageEvent).toBeDefined();
    expect(messageEvent?.payload.sender_agent_id).toBe(senderAgentId);
    expect(messageEvent?.payload.content_excerpt).toContain('This is a deliberately long message');
    expect(messageEvent?.payload.content_excerpt?.length).toBeLessThanOrEqual(96);
  });
});
