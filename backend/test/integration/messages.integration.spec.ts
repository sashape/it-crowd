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
});