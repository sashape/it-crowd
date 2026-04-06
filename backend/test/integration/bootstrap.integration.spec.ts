import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe('bootstrap integration', () => {
  it('bootstraps company and preserves idempotency', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    const payload = {
      company_name: 'IT Crowd Labs',
      company_prompt: 'Build a SaaS platform with AI operators for delivery automation.',
      language: 'en',
    };

    const first = await context.app.inject({
      method: 'POST',
      url: '/api/company/bootstrap',
      headers: {
        'idempotency-key': 'bootstrap-1',
      },
      payload,
    });

    expect(first.statusCode).toBe(201);
    const firstJson = first.json();
    expect(firstJson.success).toBe(true);

    const second = await context.app.inject({
      method: 'POST',
      url: '/api/company/bootstrap',
      headers: {
        'idempotency-key': 'bootstrap-1',
      },
      payload,
    });

    expect(second.statusCode).toBe(201);
    expect(second.json().company_id).toBe(firstJson.company_id);

    const state = await context.app.inject({
      method: 'GET',
      url: '/api/company/state?include=agents,tasks,recent_events,runs,approvals',
    });

    expect(state.statusCode).toBe(200);
    const stateJson = state.json();
    expect(stateJson.agents.length).toBe(5);
    expect(stateJson.tasks.length).toBeGreaterThan(0);
    expect(stateJson.recent_events.length).toBeGreaterThan(0);
    expect(stateJson.runs.length).toBeGreaterThan(0);
  });
});