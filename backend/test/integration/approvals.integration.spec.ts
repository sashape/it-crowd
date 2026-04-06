import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe('approval expiry integration', () => {
  it('expires pending approvals and applies expiry policy matrix', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await context.app.inject({
      method: 'POST',
      url: '/api/company/bootstrap',
      headers: { 'idempotency-key': 'bootstrap-approval' },
      payload: {
        company_name: 'Risk Ops',
        company_prompt: 'Build controlled release automation with approvals.',
        language: 'en',
      },
    });

    await context.app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'idempotency-key': 'risk-task' },
      payload: {
        title: 'Publish external release note',
        description: 'Need public external communication and deployment notice.',
        priority: 'high',
        kind: 'external_action',
        risk_level: 'critical',
        requested_by: 'founder',
      },
    });

    const approvalsBefore = await context.app.inject({ method: 'GET', url: '/api/approvals' });
    expect(approvalsBefore.statusCode).toBe(200);
    const pending = approvalsBefore.json().approvals as Array<{ id: string; status: string }>;
    expect(pending.length).toBeGreaterThan(0);

    await context.database.query(`UPDATE approvals SET expires_at = NOW() - INTERVAL '1 second' WHERE status = 'pending'`);

    const state = await context.app.inject({ method: 'GET', url: '/api/company/state?include=tasks,approvals,recent_events' });
    expect(state.statusCode).toBe(200);

    const stateJson = state.json();
    const approvals = stateJson.approvals as Array<{ status: string }>;
    expect(approvals.some((approval) => approval.status === 'expired')).toBe(true);

    const tasks = stateJson.tasks as Array<{ status: string; currentPhase: string }>;
    expect(tasks.some((task) => task.status === 'blocked' && task.currentPhase === 'blocked')).toBe(true);

    const events = stateJson.recent_events as Array<{ eventType: string }>;
    expect(events.some((event) => event.eventType === 'approval.expired')).toBe(true);
  });
});