import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

async function bootstrap(app: Awaited<ReturnType<typeof createTestApp>>['app']): Promise<void> {
  await app.inject({
    method: 'POST',
    url: '/api/company/bootstrap',
    headers: { 'idempotency-key': 'bootstrap-seed' },
    payload: {
      company_name: 'Ops Team',
      company_prompt: 'Create autonomous software delivery team.',
      language: 'en',
    },
  });
}

describe('task lifecycle integration', () => {
  it('creates task, supports idempotent POST, and emits reopened event', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await bootstrap(context.app);

    const createPayload = {
      title: 'Implement auth flow',
      description: 'Need secure session flow and audit logging for sign in.',
      priority: 'high',
      kind: 'implementation',
      risk_level: 'medium',
      requested_by: 'founder',
    };

    const firstCreate = await context.app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'idempotency-key': 'task-1' },
      payload: createPayload,
    });

    expect(firstCreate.statusCode).toBe(201);
    const firstJson = firstCreate.json();

    const secondCreate = await context.app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'idempotency-key': 'task-1' },
      payload: createPayload,
    });

    expect(secondCreate.statusCode).toBe(201);
    expect(secondCreate.json().task_id).toBe(firstJson.task_id);

    const taskId = firstJson.task_id;

    const inProgress = await context.app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      payload: { status: 'in_progress' },
    });
    expect(inProgress.statusCode).toBe(200);

    const toReview = await context.app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      payload: { status: 'review' },
    });
    expect(toReview.statusCode).toBe(200);

    const toDone = await context.app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      payload: { status: 'done' },
    });
    expect(toDone.statusCode).toBe(200);

    const reopen = await context.app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      payload: { status: 'review' },
    });
    expect(reopen.statusCode).toBe(200);

    const eventsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/events',
    });
    const events = eventsResponse.json().events as Array<{ eventType: string }>;

    expect(events.some((event) => event.eventType === 'task.reopened')).toBe(true);
    expect(events.some((event) => event.eventType === 'task.phase_changed')).toBe(true);
  });
});