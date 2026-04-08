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
    headers: { 'idempotency-key': 'bootstrap-agent-control' },
    payload: {
      company_name: 'Control Center Co',
      company_prompt: 'Run a transparent multi-agent delivery office.',
      language: 'en',
    },
  });
}

describe('agent control integration', () => {
  it('updates agent parameters and emits agent.updated event', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await bootstrap(context.app);

    const agentsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/agents',
    });
    expect(agentsResponse.statusCode).toBe(200);

    const agents = agentsResponse.json().agents as Array<{ id: string; role: string }>;
    const targetAgent = agents.find((agent) => agent.role === 'fe') ?? agents[0];
    const managerAgent = agents.find((agent) => agent.role === 'tl') ?? agents[1];

    expect(targetAgent).toBeDefined();
    expect(managerAgent).toBeDefined();

    const patchResponse = await context.app.inject({
      method: 'PATCH',
      url: `/api/agents/${targetAgent.id}`,
      payload: {
        status: 'busy',
        manager_agent_id: managerAgent.id,
        model_profile: 'precision-v2',
        runtime_kind: 'mock_runtime',
        delegation_limit: 2,
        specialization_hint: 'ui architecture and interactions',
        responsibilities: ['Build UI', 'Maintain UX consistency', 'Coordinate frontend delivery'],
        tool_policy: {
          canWriteTasks: true,
          canReview: true,
          canRequestApproval: true,
        },
      },
    });

    expect(patchResponse.statusCode).toBe(200);

    const afterUpdate = await context.app.inject({
      method: 'GET',
      url: '/api/agents',
    });
    expect(afterUpdate.statusCode).toBe(200);

    const updatedAgent = (afterUpdate.json().agents as Array<{
      id: string;
      status: string;
      managerAgentId: string | null;
      modelProfile: string;
      delegationLimit: number;
      specializationHint: string;
      responsibilities: string[];
      toolPolicy: Record<string, unknown>;
    }>).find((agent) => agent.id === targetAgent.id);

    expect(updatedAgent).toBeDefined();
    expect(updatedAgent?.status).toBe('busy');
    expect(updatedAgent?.managerAgentId).toBe(managerAgent.id);
    expect(updatedAgent?.modelProfile).toBe('precision-v2');
    expect(updatedAgent?.delegationLimit).toBe(2);
    expect(updatedAgent?.specializationHint).toBe('ui architecture and interactions');
    expect(updatedAgent?.responsibilities.length).toBe(3);
    expect(updatedAgent?.toolPolicy.canReview).toBe(true);

    const eventsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/events',
    });

    expect(eventsResponse.statusCode).toBe(200);
    const events = eventsResponse.json().events as Array<{
      eventType: string;
      entityId: string;
      payload: { changed_fields?: string[]; status?: string };
    }>;

    const updateEvent = events.find((event) => event.eventType === 'agent.updated' && event.entityId === targetAgent.id);
    expect(updateEvent).toBeDefined();
    expect(updateEvent?.payload.status).toBe('busy');
    expect(updateEvent?.payload.changed_fields).toContain('status');
    expect(updateEvent?.payload.changed_fields).toContain('specialization_hint');
  });

  it('rejects self-manager assignment', async () => {
    const context = await createTestApp();
    cleanup = context.cleanup;

    await bootstrap(context.app);

    const agentsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/agents',
    });
    const targetAgent = (agentsResponse.json().agents as Array<{ id: string }>)[0];

    const patchResponse = await context.app.inject({
      method: 'PATCH',
      url: `/api/agents/${targetAgent.id}`,
      payload: {
        manager_agent_id: targetAgent.id,
      },
    });

    expect(patchResponse.statusCode).toBe(422);
  });
});
