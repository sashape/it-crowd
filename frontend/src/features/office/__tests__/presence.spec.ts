import { describe, expect, it } from 'vitest';
import { buildPresenceProjection } from '../presence';
import type { Agent, DomainEvent, Message, Task } from '../../../types/domain';

const agents: Agent[] = [
  {
    id: 'agent-1',
    companyId: 'company-1',
    role: 'be',
    name: 'Dmitry',
    managerAgentId: null,
    status: 'idle',
    modelProfile: 'balanced-v1',
    runtimeKind: 'mock_runtime',
    delegationLimit: 1,
    specializationHint: 'api',
    responsibilities: [],
    toolPolicy: {},
    createdAt: '2026-04-08T10:00:00.000Z',
  },
  {
    id: 'agent-2',
    companyId: 'company-1',
    role: 'qa',
    name: 'Roman',
    managerAgentId: null,
    status: 'idle',
    modelProfile: 'balanced-v1',
    runtimeKind: 'mock_runtime',
    delegationLimit: 1,
    specializationHint: 'quality',
    responsibilities: [],
    toolPolicy: {},
    createdAt: '2026-04-08T10:00:00.000Z',
  },
];

const tasks: Task[] = [
  {
    id: 'task-1',
    companyId: 'company-1',
    title: 'Ship API',
    description: 'desc',
    status: 'in_progress',
    currentPhase: 'execution',
    riskLevel: 'medium',
    ownerAgentId: 'agent-1',
    reviewerAgentId: null,
    updatedAt: '2026-04-08T10:00:00.000Z',
  },
  {
    id: 'task-2',
    companyId: 'company-1',
    title: 'Check blocker',
    description: 'desc',
    status: 'blocked',
    currentPhase: 'approval',
    riskLevel: 'high',
    ownerAgentId: 'agent-2',
    reviewerAgentId: null,
    updatedAt: '2026-04-08T10:01:00.000Z',
  },
];

const events: DomainEvent[] = [
  {
    eventId: 'event-1',
    eventType: 'task.assigned',
    companyId: 'company-1',
    runId: 'run-1',
    traceId: 'trace-1',
    entityType: 'task',
    entityId: 'task-1',
    causedByType: 'agent',
    causedById: 'agent-1',
    ts: '2026-04-08T10:02:00.000Z',
    payload: {},
  },
];

const messages: Message[] = [
  {
    id: 'message-1',
    runId: 'run-1',
    taskId: 'task-1',
    threadId: 'thread-1',
    messageType: 'task_comment',
    senderType: 'agent',
    senderAgentId: 'agent-1',
    content: 'Implementing API contract and pushing update now.',
    createdAt: '2026-04-08T10:03:00.000Z',
  },
];

describe('buildPresenceProjection', () => {
  it('maps active and blocked zones deterministically', () => {
    const first = buildPresenceProjection({
      language: 'en',
      agents,
      tasks,
      recentEvents: events,
      messages,
    });

    const second = buildPresenceProjection({
      language: 'en',
      agents,
      tasks,
      recentEvents: events,
      messages,
    });

    expect(first).toEqual(second);
    expect(first['agent-1'].zone).toBe('desk');
    expect(first['agent-1'].mood).toBe('active');
    expect(first['agent-2'].zone).toBe('discussion');
    expect(first['agent-2'].mood).toBe('blocked');
    expect(first['agent-1'].headline).toContain('Implementing API contract');
  });
});
