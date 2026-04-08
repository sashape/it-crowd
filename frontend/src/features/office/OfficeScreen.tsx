import { useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, CompanyState, DomainEvent, MessagePostedPayload, Task } from '../../types/domain';
import { enqueueBubble, getCurrentBubble, pruneBubbles, type BubbleEntry } from './bubble-queue';
import { OfficeScene } from './OfficeScene';
import { buildPresenceProjection } from './presence';

type PanelTab = 'tasks' | 'events' | 'approvals' | 'runs';

interface OfficeScreenProps {
  state: CompanyState;
  isSocketConnected: boolean;
  onRefresh: () => Promise<void>;
}

function extractMessageBubble(event: DomainEvent): { agentId: string; text: string } | null {
  if (event.eventType !== 'message.posted' || event.causedByType !== 'agent') {
    return null;
  }

  const payload = event.payload as MessagePostedPayload;
  if (!payload.content_excerpt || !event.causedById) {
    return null;
  }

  return {
    agentId: event.causedById,
    text: payload.content_excerpt,
  };
}

function eventBubbleTemplate(language: 'ru' | 'en', eventType: string): string | null {
  const ru: Record<string, string> = {
    'task.assigned': 'Беру задачу в работу.',
    'task.review_requested': 'Прошу ревью по результату.',
    'task.blocked': 'Есть блокер, нужна помощь.',
    'approval.required': 'Нужно подтверждение решения.',
    'runtime.artifact_collected': 'Артефакт готов и сохранен.',
  };

  const en: Record<string, string> = {
    'task.assigned': 'Taking the task now.',
    'task.review_requested': 'Requesting review on output.',
    'task.blocked': 'Hit a blocker, need support.',
    'approval.required': 'Approval is needed for next step.',
    'runtime.artifact_collected': 'Artifact is ready and stored.',
  };

  const dictionary = language === 'ru' ? ru : en;
  return dictionary[eventType] ?? null;
}

function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1024px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const onChange = (event: MediaQueryListEvent): void => {
      setCompact(event.matches);
    };

    setCompact(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return compact;
}

function formatTs(value: string): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}

function renderTaskOwner(task: Task, agentsById: Map<string, Agent>): string {
  if (!task.ownerAgentId) {
    return 'unassigned';
  }

  return agentsById.get(task.ownerAgentId)?.name ?? 'unknown';
}

export function OfficeScreen({ state, isSocketConnected, onRefresh }: OfficeScreenProps): JSX.Element {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(state.agents[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<PanelTab>('tasks');
  const [bubbleQueues, setBubbleQueues] = useState<Record<string, BubbleEntry[]>>({});
  const processedEventsRef = useRef<Set<string>>(new Set());
  const processedMessagesRef = useRef<Set<string>>(new Set());

  const isCompact = useCompactLayout();

  const agentsById = useMemo(() => {
    return new Map(state.agents.map((agent) => [agent.id, agent]));
  }, [state.agents]);

  const tasksById = useMemo(() => {
    return new Map(state.tasks.map((task) => [task.id, task]));
  }, [state.tasks]);

  const presenceByAgent = useMemo(() => {
    return buildPresenceProjection({
      language: state.company.language,
      agents: state.agents,
      tasks: state.tasks,
      recentEvents: state.recent_events,
      messages: state.messages,
    });
  }, [state.agents, state.company.language, state.messages, state.recent_events, state.tasks]);

  useEffect(() => {
    if (!selectedAgentId && state.agents.length > 0) {
      setSelectedAgentId(state.agents[0].id);
      return;
    }

    if (selectedAgentId && !state.agents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(state.agents[0]?.id ?? null);
    }
  }, [selectedAgentId, state.agents]);

  useEffect(() => {
    const orderedMessages = [...state.messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    let hasChanges = false;

    setBubbleQueues((previous) => {
      const next: Record<string, BubbleEntry[]> = { ...previous };
      const now = Date.now();

      for (const message of orderedMessages) {
        if (processedMessagesRef.current.has(message.id)) {
          continue;
        }

        processedMessagesRef.current.add(message.id);
        if (!message.senderAgentId || !message.content.trim()) {
          continue;
        }

        hasChanges = true;
        next[message.senderAgentId] = enqueueBubble(next[message.senderAgentId] ?? [], message.content, now);
      }

      return hasChanges ? next : previous;
    });
  }, [state.messages]);

  useEffect(() => {
    const orderedEvents = [...state.recent_events].sort((left, right) => left.ts.localeCompare(right.ts));
    let hasChanges = false;

    setBubbleQueues((previous) => {
      const next: Record<string, BubbleEntry[]> = { ...previous };
      const now = Date.now();

      for (const event of orderedEvents) {
        if (processedEventsRef.current.has(event.eventId)) {
          continue;
        }

        processedEventsRef.current.add(event.eventId);

        const messageBubble = extractMessageBubble(event);
        if (messageBubble) {
          hasChanges = true;
          next[messageBubble.agentId] = enqueueBubble(next[messageBubble.agentId] ?? [], messageBubble.text, now);
          continue;
        }

        if (event.causedByType !== 'agent') {
          continue;
        }

        const template = eventBubbleTemplate(state.company.language, event.eventType);
        if (!template) {
          continue;
        }

        hasChanges = true;
        next[event.causedById] = enqueueBubble(next[event.causedById] ?? [], template, now);
      }

      return hasChanges ? next : previous;
    });
  }, [state.company.language, state.recent_events]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBubbleQueues((previous) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, BubbleEntry[]> = {};

        for (const [agentId, queue] of Object.entries(previous)) {
          const pruned = pruneBubbles(queue, now);
          next[agentId] = pruned;
          if (pruned.length !== queue.length) {
            changed = true;
          }
        }

        return changed ? next : previous;
      });
    }, 300);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const bubbleTextByAgent = useMemo(() => {
    const now = Date.now();
    const result: Record<string, string | null> = {};

    for (const agent of state.agents) {
      const queue = bubbleQueues[agent.id] ?? [];
      const current = getCurrentBubble(queue, now);
      result[agent.id] = current?.text ?? null;
    }

    return result;
  }, [bubbleQueues, state.agents]);

  const selectedAgent = selectedAgentId ? agentsById.get(selectedAgentId) ?? null : null;
  const selectedPresence = selectedAgent ? presenceByAgent[selectedAgent.id] : null;
  const selectedTask = selectedPresence?.focusTaskId ? tasksById.get(selectedPresence.focusTaskId) ?? null : null;

  const taskItems = state.tasks.slice(0, 14);
  const eventItems = state.recent_events.slice(0, 18);
  const approvalItems = state.approvals.slice(0, 12);
  const runItems = state.runs.slice(0, 10);

  return (
    <div className="office-shell">
      <section className="office-scene-section">
        <header className="office-scene-header">
          <div>
            <h1>{state.company.name}</h1>
            <p>{state.company.prompt}</p>
          </div>
          <div className="office-live-controls">
            <span className={`live-dot ${isSocketConnected ? 'is-live' : 'is-offline'}`}>{isSocketConnected ? 'LIVE' : 'SYNC'}</span>
            <button type="button" onClick={() => void onRefresh()}>
              Refresh
            </button>
          </div>
        </header>

        <div className="office-scene-stack">
          <OfficeScene
            agents={state.agents}
            presenceByAgent={presenceByAgent}
            bubbleTextByAgent={bubbleTextByAgent}
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgentId}
          />

          {selectedAgent ? (
            <article className="agent-card">
              <h2>{selectedAgent.name}</h2>
              <p className="agent-role">{selectedAgent.role.toUpperCase()} • {selectedPresence?.zone ?? 'lounge'}</p>
              <p>{selectedAgent.specializationHint}</p>
              <p className="agent-focus-title">Focus</p>
              <p>{selectedTask ? selectedTask.title : 'No active task'}</p>
              <p className="agent-focus-title">Speech</p>
              <p>{bubbleTextByAgent[selectedAgent.id] ?? selectedPresence?.headline ?? '...'}</p>
            </article>
          ) : null}
        </div>
      </section>

      <aside className={`office-panels ${isCompact ? 'is-compact' : ''}`}>
        {isCompact ? (
          <div className="panel-tabs">
            <button type="button" className={activeTab === 'tasks' ? 'is-active' : ''} onClick={() => setActiveTab('tasks')}>
              Tasks
            </button>
            <button type="button" className={activeTab === 'events' ? 'is-active' : ''} onClick={() => setActiveTab('events')}>
              Events
            </button>
            <button type="button" className={activeTab === 'approvals' ? 'is-active' : ''} onClick={() => setActiveTab('approvals')}>
              Approvals
            </button>
            <button type="button" className={activeTab === 'runs' ? 'is-active' : ''} onClick={() => setActiveTab('runs')}>
              Runs
            </button>
          </div>
        ) : null}

        {(activeTab === 'tasks' || !isCompact) && (
          <section className="panel-block">
            <h3>Task Board</h3>
            <ul>
              {taskItems.map((task) => (
                <li key={task.id}>
                  <p>{task.title}</p>
                  <small>
                    {task.status} • {task.currentPhase} • {renderTaskOwner(task, agentsById)}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(activeTab === 'events' || !isCompact) && (
          <section className="panel-block">
            <h3>Event Stream</h3>
            <ul>
              {eventItems.map((event) => (
                <li key={event.eventId}>
                  <p>{event.eventType}</p>
                  <small>
                    {event.causedByType}:{event.causedById} • {formatTs(event.ts)}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(activeTab === 'approvals' || !isCompact) && (
          <section className="panel-block">
            <h3>Approvals</h3>
            <ul>
              {approvalItems.length === 0 ? (
                <li>
                  <p>No pending approvals</p>
                </li>
              ) : (
                approvalItems.map((approval) => (
                  <li key={approval.id}>
                    <p>{approval.status}</p>
                    <small>
                      {approval.urgency} • {formatTs(approval.expiresAt)}
                    </small>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {(activeTab === 'runs' || !isCompact) && (
          <section className="panel-block">
            <h3>Runs</h3>
            <ul>
              {runItems.map((run) => (
                <li key={run.runId}>
                  <p>{run.status}</p>
                  <small>
                    steps {run.stepCount} • {run.outcome ?? 'n/a'}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
