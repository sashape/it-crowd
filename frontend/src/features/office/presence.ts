import type { Agent, DomainEvent, Message, Task } from '../../types/domain';

export type OfficeZone = 'desk' | 'discussion' | 'lounge';
export type PresenceMood = 'active' | 'blocked' | 'idle';

export interface AgentPresence {
  agentId: string;
  zone: OfficeZone;
  mood: PresenceMood;
  focusTaskId: string | null;
  focusTaskTitle: string | null;
  headline: string | null;
}

interface PresenceInput {
  language: 'ru' | 'en';
  agents: Agent[];
  tasks: Task[];
  recentEvents: DomainEvent[];
  messages: Message[];
}

const ACTIVE_PHASES = new Set<Task['currentPhase']>(['planning', 'execution', 'review']);

function latestByUpdated(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.id.localeCompare(right.id);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function textByEvent(language: 'ru' | 'en', eventType: string): string | null {
  const ru: Record<string, string> = {
    'task.assigned': 'Принял задачу, иду к рабочему месту.',
    'task.review_requested': 'Зову ревью, проверим вместе.',
    'task.blocked': 'Нужна помощь, пока в блоке.',
    'runtime.artifact_collected': 'Собрал артефакт, готов к следующему шагу.',
    'orchestrator.warning': 'Есть предупреждение, сверяю риски.',
  };

  const en: Record<string, string> = {
    'task.assigned': 'Task accepted, moving to workstation.',
    'task.review_requested': 'Review requested, syncing with QA.',
    'task.blocked': 'Blocked for now, asking for support.',
    'runtime.artifact_collected': 'Artifact collected, next step ready.',
    'orchestrator.warning': 'Warning detected, checking risk limits.',
  };

  const dictionary = language === 'ru' ? ru : en;
  return dictionary[eventType] ?? null;
}

function clipHeadline(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 64) {
    return normalized;
  }

  return `${normalized.slice(0, 63).trimEnd()}…`;
}

function findLatestAgentMessage(messages: Message[], agentId: string): Message | null {
  const message = messages.find((item) => item.senderAgentId === agentId);
  return message ?? null;
}

function findLatestAgentEvent(events: DomainEvent[], agentId: string): DomainEvent | null {
  const event = events.find((item) => item.causedByType === 'agent' && item.causedById === agentId);
  return event ?? null;
}

function deriveZone(task: Task | null): { zone: OfficeZone; mood: PresenceMood } {
  if (!task) {
    return { zone: 'lounge', mood: 'idle' };
  }

  const isBlocked = task.status === 'blocked' || task.currentPhase === 'approval' || task.currentPhase === 'blocked';
  if (isBlocked) {
    return { zone: 'discussion', mood: 'blocked' };
  }

  const isActive = task.status === 'in_progress' || task.status === 'review' || ACTIVE_PHASES.has(task.currentPhase);
  if (isActive) {
    return { zone: 'desk', mood: 'active' };
  }

  return { zone: 'lounge', mood: 'idle' };
}

export function buildPresenceProjection(input: PresenceInput): Record<string, AgentPresence> {
  const tasksByOwner = new Map<string, Task[]>();
  for (const task of input.tasks) {
    if (!task.ownerAgentId) {
      continue;
    }

    const owned = tasksByOwner.get(task.ownerAgentId) ?? [];
    owned.push(task);
    tasksByOwner.set(task.ownerAgentId, owned);
  }

  const sortedMessages = [...input.messages].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const sortedEvents = [...input.recentEvents].sort((left, right) => right.ts.localeCompare(left.ts));

  const projection: Record<string, AgentPresence> = {};

  for (const agent of input.agents) {
    const ownedTasks = latestByUpdated(tasksByOwner.get(agent.id) ?? []);
    const focusTask =
      ownedTasks.find((task) => task.status === 'blocked' || task.currentPhase === 'approval' || task.currentPhase === 'blocked') ??
      ownedTasks.find((task) => task.status === 'in_progress' || task.status === 'review' || ACTIVE_PHASES.has(task.currentPhase)) ??
      ownedTasks[0] ??
      null;

    const { zone, mood } = deriveZone(focusTask);
    const latestMessage = findLatestAgentMessage(sortedMessages, agent.id);
    const latestEvent = findLatestAgentEvent(sortedEvents, agent.id);

    let headline: string | null = null;
    if (latestMessage?.content) {
      headline = clipHeadline(latestMessage.content);
    } else if (latestEvent) {
      headline = textByEvent(input.language, latestEvent.eventType);
    } else if (focusTask) {
      headline = input.language === 'ru' ? `Фокус: ${focusTask.title}` : `Focus: ${focusTask.title}`;
    }

    projection[agent.id] = {
      agentId: agent.id,
      zone,
      mood,
      focusTaskId: focusTask?.id ?? null,
      focusTaskTitle: focusTask?.title ?? null,
      headline,
    };
  }

  return projection;
}

