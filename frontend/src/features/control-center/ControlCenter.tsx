import { useEffect, useMemo, useState } from 'react';
import { createTask, postMessage, updateAgent, updateTask } from '../../api/client';
import type { Agent, CompanyState, Message, Task } from '../../types/domain';

type ControlTab = 'agents' | 'kanban' | 'chats';

type AgentDraft = {
  role: Agent['role'];
  name: string;
  manager_agent_id: string | null;
  status: Agent['status'];
  model_profile: string;
  runtime_kind: Agent['runtimeKind'];
  delegation_limit: number;
  specialization_hint: string;
  responsibilities_text: string;
  tool_policy_text: string;
};

interface ControlCenterProps {
  state: CompanyState;
  isCompact: boolean;
  onRefresh: () => Promise<void>;
}

const TASK_COLUMNS: Array<{ status: Task['status']; title: string }> = [
  { status: 'todo', title: 'Todo' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'blocked', title: 'Blocked' },
  { status: 'done', title: 'Done' },
];

function toAgentDraft(agent: Agent): AgentDraft {
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

function parseResponsibilities(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatSender(message: Message, agentsById: Map<string, Agent>): string {
  if (message.senderType === 'agent') {
    return agentsById.get(message.senderAgentId ?? '')?.name ?? 'Agent';
  }

  if (message.senderType === 'human') {
    return 'Founder';
  }

  return 'System';
}

function formatMessageTs(value: string): string {
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

export function ControlCenter({ state, isCompact, onRefresh }: ControlCenterProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<ControlTab>('agents');

  const [selectedAgentId, setSelectedAgentId] = useState<string>(state.agents[0]?.id ?? '');
  const [agentDraft, setAgentDraft] = useState<AgentDraft | null>(state.agents[0] ? toAgentDraft(state.agents[0]) : null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [taskKind, setTaskKind] = useState<'analysis' | 'implementation' | 'review' | 'communication' | 'deployment' | 'external_action'>('implementation');
  const [taskRisk, setTaskRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const [chatRecipientId, setChatRecipientId] = useState<string>(state.agents[0]?.id ?? '');
  const [chatText, setChatText] = useState('');

  const [isSavingAgent, setSavingAgent] = useState(false);
  const [isCreatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isSendingMessage, setSendingMessage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const agentsById = useMemo(() => new Map(state.agents.map((agent) => [agent.id, agent])), [state.agents]);

  useEffect(() => {
    const selected = state.agents.find((agent) => agent.id === selectedAgentId) ?? state.agents[0];
    if (!selected) {
      setSelectedAgentId('');
      setAgentDraft(null);
      return;
    }

    setSelectedAgentId(selected.id);
    setAgentDraft(toAgentDraft(selected));
  }, [selectedAgentId, state.agents]);

  useEffect(() => {
    if (!chatRecipientId && state.agents[0]) {
      setChatRecipientId(state.agents[0].id);
    }

    if (chatRecipientId && !state.agents.some((agent) => agent.id === chatRecipientId)) {
      setChatRecipientId(state.agents[0]?.id ?? '');
    }
  }, [chatRecipientId, state.agents]);

  const clearActionStatus = (): void => {
    setActionError(null);
    setActionSuccess(null);
  };

  const handleSaveAgent = async (): Promise<void> => {
    if (!selectedAgentId || !agentDraft) {
      return;
    }

    clearActionStatus();

    let parsedToolPolicy: Record<string, unknown>;
    try {
      const parsed = JSON.parse(agentDraft.tool_policy_text) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Tool policy must be a JSON object.');
      }

      parsedToolPolicy = parsed as Record<string, unknown>;
    } catch {
      setActionError('Tool policy must be valid JSON object.');
      return;
    }

    try {
      setSavingAgent(true);
      await updateAgent(selectedAgentId, {
        role: agentDraft.role,
        name: agentDraft.name,
        manager_agent_id: agentDraft.manager_agent_id,
        status: agentDraft.status,
        model_profile: agentDraft.model_profile,
        runtime_kind: agentDraft.runtime_kind,
        delegation_limit: Number(agentDraft.delegation_limit),
        specialization_hint: agentDraft.specialization_hint,
        responsibilities: parseResponsibilities(agentDraft.responsibilities_text),
        tool_policy: parsedToolPolicy,
      });
      await onRefresh();
      setActionSuccess('Agent settings updated.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update agent.');
    } finally {
      setSavingAgent(false);
    }
  };

  const handleCreateTask = async (): Promise<void> => {
    if (taskTitle.trim().length < 3 || taskDescription.trim().length < 10) {
      setActionError('Main task requires title (>=3) and description (>=10).');
      return;
    }

    clearActionStatus();

    try {
      setCreatingTask(true);
      await createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        kind: taskKind,
        risk_level: taskRisk,
        requested_by: 'founder',
      });
      await onRefresh();
      setTaskTitle('');
      setTaskDescription('');
      setActionSuccess('Main task created and queued for agents.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, nextStatus: Task['status']): Promise<void> => {
    clearActionStatus();

    try {
      setUpdatingTaskId(taskId);
      await updateTask(taskId, { status: nextStatus });
      await onRefresh();
      setActionSuccess('Task status updated.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!chatRecipientId || chatText.trim().length === 0) {
      setActionError('Choose recipient and message text.');
      return;
    }

    clearActionStatus();

    try {
      setSendingMessage(true);
      await postMessage({
        thread_id: `direct-${chatRecipientId}`,
        message_type: 'direct_message',
        sender_type: 'human',
        content: chatText.trim(),
        payload: {
          channel: 'control_center',
        },
        mentioned_agent_id: chatRecipientId,
        requires_response: true,
      });
      await onRefresh();
      setChatText('');
      setActionSuccess('Message sent.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const tasksByColumn = useMemo(() => {
    const map = new Map<Task['status'], Task[]>();
    for (const column of TASK_COLUMNS) {
      map.set(column.status, []);
    }

    for (const task of state.tasks) {
      const tasks = map.get(task.status);
      if (tasks) {
        tasks.push(task);
      }
    }

    for (const tasks of map.values()) {
      tasks.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }

    return map;
  }, [state.tasks]);

  const messageFeed = useMemo(() => {
    return [...state.messages].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 120);
  }, [state.messages]);

  const selectedAgent = state.agents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <aside className={`control-center ${isCompact ? 'is-compact' : ''}`}>
      <header className="control-center-header">
        <h3>Control Center</h3>
        <p>Founder command zone: manage agents, shared kanban, and team chats.</p>
      </header>

      <div className="control-tabs">
        <button type="button" className={activeTab === 'agents' ? 'is-active' : ''} onClick={() => setActiveTab('agents')}>
          Agents
        </button>
        <button type="button" className={activeTab === 'kanban' ? 'is-active' : ''} onClick={() => setActiveTab('kanban')}>
          Kanban
        </button>
        <button type="button" className={activeTab === 'chats' ? 'is-active' : ''} onClick={() => setActiveTab('chats')}>
          Chats
        </button>
      </div>

      {actionError ? <p className="control-error">{actionError}</p> : null}
      {actionSuccess ? <p className="control-success">{actionSuccess}</p> : null}

      {activeTab === 'agents' && selectedAgent && agentDraft ? (
        <section className="control-pane">
          <div className="control-agent-list">
            {state.agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className={agent.id === selectedAgent.id ? 'is-active' : ''}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setAgentDraft(toAgentDraft(agent));
                }}
              >
                {agent.name} ({agent.role.toUpperCase()})
              </button>
            ))}
          </div>

          <div className="control-form-grid">
            <label>
              Name
              <input value={agentDraft.name} onChange={(event) => setAgentDraft({ ...agentDraft, name: event.target.value })} />
            </label>

            <label>
              Role
              <select value={agentDraft.role} onChange={(event) => setAgentDraft({ ...agentDraft, role: event.target.value as Agent['role'] })}>
                <option value="pm">PM</option>
                <option value="tl">TL</option>
                <option value="be">BE</option>
                <option value="fe">FE</option>
                <option value="qa">QA</option>
              </select>
            </label>

            <label>
              Status
              <select value={agentDraft.status} onChange={(event) => setAgentDraft({ ...agentDraft, status: event.target.value as Agent['status'] })}>
                <option value="idle">idle</option>
                <option value="busy">busy</option>
                <option value="blocked">blocked</option>
                <option value="offline">offline</option>
              </select>
            </label>

            <label>
              Manager
              <select
                value={agentDraft.manager_agent_id ?? ''}
                onChange={(event) => setAgentDraft({ ...agentDraft, manager_agent_id: event.target.value || null })}
              >
                <option value="">none</option>
                {state.agents
                  .filter((agent) => agent.id !== selectedAgent.id)
                  .map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Model Profile
              <input
                value={agentDraft.model_profile}
                onChange={(event) => setAgentDraft({ ...agentDraft, model_profile: event.target.value })}
              />
            </label>

            <label>
              Runtime Kind
              <select
                value={agentDraft.runtime_kind}
                onChange={(event) => setAgentDraft({ ...agentDraft, runtime_kind: event.target.value as Agent['runtimeKind'] })}
              >
                <option value="mock_runtime">mock_runtime</option>
                <option value="openclaw">openclaw</option>
              </select>
            </label>

            <label>
              Delegation Limit
              <input
                type="number"
                min={0}
                max={20}
                value={agentDraft.delegation_limit}
                onChange={(event) =>
                  setAgentDraft({
                    ...agentDraft,
                    delegation_limit: Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 0,
                  })
                }
              />
            </label>

            <label className="control-field-wide">
              Specialization Hint
              <input
                value={agentDraft.specialization_hint}
                onChange={(event) => setAgentDraft({ ...agentDraft, specialization_hint: event.target.value })}
              />
            </label>

            <label className="control-field-wide">
              Responsibilities (one per line)
              <textarea
                rows={4}
                value={agentDraft.responsibilities_text}
                onChange={(event) => setAgentDraft({ ...agentDraft, responsibilities_text: event.target.value })}
              />
            </label>

            <label className="control-field-wide">
              Tool Policy (JSON)
              <textarea
                rows={6}
                value={agentDraft.tool_policy_text}
                onChange={(event) => setAgentDraft({ ...agentDraft, tool_policy_text: event.target.value })}
              />
            </label>
          </div>

          <button type="button" className="control-primary" disabled={isSavingAgent} onClick={() => void handleSaveAgent()}>
            {isSavingAgent ? 'Saving...' : 'Save Agent Settings'}
          </button>
        </section>
      ) : null}

      {activeTab === 'kanban' ? (
        <section className="control-pane">
          <div className="control-task-form">
            <h4>Main Task</h4>
            <p>Set a top-level task and let agents decompose and execute it.</p>

            <input placeholder="Title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
            <textarea
              rows={3}
              placeholder="Description"
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
            />

            <div className="control-inline-grid">
              <label>
                Priority
                <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as typeof taskPriority)}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>

              <label>
                Kind
                <select value={taskKind} onChange={(event) => setTaskKind(event.target.value as typeof taskKind)}>
                  <option value="analysis">analysis</option>
                  <option value="implementation">implementation</option>
                  <option value="review">review</option>
                  <option value="communication">communication</option>
                  <option value="deployment">deployment</option>
                  <option value="external_action">external_action</option>
                </select>
              </label>

              <label>
                Risk
                <select value={taskRisk} onChange={(event) => setTaskRisk(event.target.value as typeof taskRisk)}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </label>
            </div>

            <button type="button" className="control-primary" disabled={isCreatingTask} onClick={() => void handleCreateTask()}>
              {isCreatingTask ? 'Creating...' : 'Create Main Task'}
            </button>
          </div>

          <div className="kanban-grid">
            {TASK_COLUMNS.map((column) => (
              <article key={column.status} className="kanban-column">
                <h4>{column.title}</h4>
                <ul>
                  {(tasksByColumn.get(column.status) ?? []).map((task) => (
                    <li key={task.id}>
                      <p>{task.title}</p>
                      <small>{task.currentPhase}</small>
                      <small>owner: {agentsById.get(task.ownerAgentId ?? '')?.name ?? 'unassigned'}</small>

                      <label>
                        Move to
                        <select
                          defaultValue={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(event) => void handleTaskStatusUpdate(task.id, event.target.value as Task['status'])}
                        >
                          <option value="todo">todo</option>
                          <option value="in_progress">in_progress</option>
                          <option value="review">review</option>
                          <option value="blocked">blocked</option>
                          <option value="done">done</option>
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'chats' ? (
        <section className="control-pane">
          <div className="chat-composer">
            <h4>Founder Message</h4>
            <label>
              Recipient
              <select value={chatRecipientId} onChange={(event) => setChatRecipientId(event.target.value)}>
                {state.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>

            <textarea
              rows={3}
              placeholder="Write message to selected agent"
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
            />

            <button type="button" className="control-primary" disabled={isSendingMessage} onClick={() => void handleSendMessage()}>
              {isSendingMessage ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          <div className="chat-feed">
            <h4>Team Chat Feed</h4>
            <ul>
              {messageFeed.map((message) => (
                <li key={message.id} className={message.senderType === 'agent' ? 'agent-message' : 'founder-message'}>
                  <p>
                    <strong>{formatSender(message, agentsById)}</strong>
                    <span>{formatMessageTs(message.createdAt)}</span>
                  </p>
                  <small>{message.threadId}</small>
                  <p>{message.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
