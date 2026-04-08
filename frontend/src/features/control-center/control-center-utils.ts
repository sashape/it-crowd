import type { Agent, DomainEvent, Message, OrchestrationRun, Task } from '../../types/domain';
import { createDefaultDashboardLayout, type DashboardLayoutState, loadDashboardLayout } from './dashboard-layout';
import type { AgentDraft } from './control-center-config';

export function toAgentDraft(agent: Agent): AgentDraft {
  return {
    role: agent.role,
    name: agent.name,
    manager_agent_id: agent.managerAgentId,
    status: agent.status,
    model_profile: agent.modelProfile,
    runtime_kind: agent.runtimeKind,
    delegation_limit: agent.delegationLimit,
    specialization_hint: agent.specializationHint,
    responsibilities_text: agent.responsibilities.join('\n'),
    tool_policy_text: JSON.stringify(agent.toolPolicy, null, 2),
  };
}

export function parseResponsibilities(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function formatSender(message: Message, agentsById: Map<string, Agent>): string {
  if (message.senderType === 'agent') {
    return agentsById.get(message.senderAgentId ?? '')?.name ?? 'Agent';
  }

  if (message.senderType === 'human') {
    return 'Founder';
  }

  return 'System';
}

export function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function formatRunOutcome(run: OrchestrationRun): string {
  if (run.outcome) {
    return run.outcome;
  }

  return run.status === 'running' ? 'in_progress' : 'pending';
}

export function formatEventTitle(event: DomainEvent): string {
  return `${event.eventType} • ${event.entityType}:${event.entityId}`;
}

export function parseTaskOwnerMap(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (!task.ownerAgentId || task.status === 'done') {
      continue;
    }

    const current = map.get(task.ownerAgentId) ?? 0;
    map.set(task.ownerAgentId, current + 1);
  }

  return map;
}

export function createLocalStorageLayout(): DashboardLayoutState {
  if (typeof window === 'undefined') {
    return createDefaultDashboardLayout();
  }

  try {
    return loadDashboardLayout(window.localStorage);
  } catch {
    return createDefaultDashboardLayout();
  }
}

