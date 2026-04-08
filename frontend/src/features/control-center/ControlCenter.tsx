import { useEffect, useMemo, useState } from 'react';
import { createTask, postMessage, updateAgent, updateTask } from '../../api/client';
import type { Task } from '../../types/domain';
import { ControlCenterProps, SCREEN_ITEMS } from './control-center-config';
import {
  createDefaultDashboardLayout,
  type DashboardLayoutState,
  type DashboardScreen as DashboardScreenId,
  type DashboardWidgetId,
  getNextWidgetSize,
  reorderWidgets,
  saveDashboardLayout,
} from './dashboard-layout';
import {
  createLocalStorageLayout,
  parseTaskOwnerMap,
  parseResponsibilities,
  toAgentDraft,
} from './control-center-utils';
import { AgentsScreen, CommsScreen, DashboardScreen, EventsScreen, RunsScreen, WorkScreen } from './screens';

export function ControlCenter({ state, isCompact, onRefresh }: ControlCenterProps): JSX.Element {
  const [activeScreen, setActiveScreen] = useState<DashboardScreenId>('dashboard');

  const [selectedAgentId, setSelectedAgentId] = useState<string>(state.agents[0]?.id ?? '');
  const [agentDraft, setAgentDraft] = useState(() => (state.agents[0] ? toAgentDraft(state.agents[0]) : null));

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [taskKind, setTaskKind] = useState<'analysis' | 'implementation' | 'review' | 'communication' | 'deployment' | 'external_action'>('implementation');
  const [taskRisk, setTaskRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const [chatRecipientId, setChatRecipientId] = useState<string>(state.agents[0]?.id ?? '');
  const [chatText, setChatText] = useState('');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutState>(() => createLocalStorageLayout());
  const [draggedWidgetId, setDraggedWidgetId] = useState<DashboardWidgetId | null>(null);

  const [isSavingAgent, setSavingAgent] = useState(false);
  const [isCreatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isSendingMessage, setSendingMessage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const agentsById = useMemo(() => new Map(state.agents.map((agent) => [agent.id, agent])), [state.agents]);

  useEffect(() => {
    if (state.agents.length === 0) {
      setSelectedAgentId('');
      setAgentDraft(null);
      return;
    }

    if (!selectedAgentId || !state.agents.some((agent) => agent.id === selectedAgentId)) {
      const first = state.agents[0];
      setSelectedAgentId(first.id);
      setAgentDraft(toAgentDraft(first));
    }
  }, [selectedAgentId, state.agents]);

  useEffect(() => {
    if (!chatRecipientId && state.agents[0]) {
      setChatRecipientId(state.agents[0].id);
    }

    if (chatRecipientId && !state.agents.some((agent) => agent.id === chatRecipientId)) {
      setChatRecipientId(state.agents[0]?.id ?? '');
    }
  }, [chatRecipientId, state.agents]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    saveDashboardLayout(window.localStorage, dashboardLayout);
  }, [dashboardLayout]);

  const clearActionStatus = (): void => {
    setActionError(null);
    setActionSuccess(null);
  };

  const handleAgentSelect = (agentId: string): void => {
    setSelectedAgentId(agentId);
    const selected = state.agents.find((agent) => agent.id === agentId);
    if (selected) {
      setAgentDraft(toAgentDraft(selected));
    }
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
    const currentTask = state.tasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === nextStatus) {
      setDraggedTaskId(null);
      return;
    }

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
      setDraggedTaskId(null);
    }
  };

  const handleTaskDropToStatus = async (status: Task['status']): Promise<void> => {
    if (!draggedTaskId) {
      return;
    }

    await handleTaskStatusUpdate(draggedTaskId, status);
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
    map.set('todo', []);
    map.set('in_progress', []);
    map.set('review', []);
    map.set('blocked', []);
    map.set('done', []);

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

  const selectedAgent = useMemo(() => {
    return state.agents.find((agent) => agent.id === selectedAgentId) ?? null;
  }, [selectedAgentId, state.agents]);

  const blockedTasks = useMemo(() => {
    return [...state.tasks]
      .filter((task) => task.status === 'blocked')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 8);
  }, [state.tasks]);

  const pendingApprovals = useMemo(() => {
    return [...state.approvals]
      .filter((approval) => approval.status === 'pending')
      .sort((left, right) => left.expiresAt.localeCompare(right.expiresAt))
      .slice(0, 8);
  }, [state.approvals]);

  const activeRuns = useMemo(() => {
    return [...state.runs]
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
      .slice(0, 20);
  }, [state.runs]);

  const recentEvents = useMemo(() => {
    return [...state.recent_events]
      .sort((left, right) => right.ts.localeCompare(left.ts))
      .slice(0, 60);
  }, [state.recent_events]);

  const taskOwnerCounts = useMemo(() => parseTaskOwnerMap(state.tasks), [state.tasks]);

  const dashboardKpis = useMemo(() => {
    const inProgress = state.tasks.filter((task) => task.status === 'in_progress').length;
    const blocked = state.tasks.filter((task) => task.status === 'blocked').length;
    const approvalsPending = state.approvals.filter((approval) => approval.status === 'pending').length;
    const activeAgents = state.agents.filter((agent) => agent.status !== 'offline').length;

    return {
      inProgress,
      blocked,
      approvalsPending,
      activeAgents,
    };
  }, [state.agents, state.approvals, state.tasks]);

  const handleWidgetDrop = (targetId: DashboardWidgetId): void => {
    if (!draggedWidgetId) {
      return;
    }

    setDashboardLayout((previous) => ({
      ...previous,
      order: reorderWidgets(previous.order, draggedWidgetId, targetId),
    }));
    setDraggedWidgetId(null);
  };

  const handleWidgetSizeCycle = (widgetId: DashboardWidgetId): void => {
    setDashboardLayout((previous) => ({
      ...previous,
      sizes: {
        ...previous.sizes,
        [widgetId]: getNextWidgetSize(previous.sizes[widgetId]),
      },
    }));
  };

  const renderScreen = (): JSX.Element => {
    if (activeScreen === 'dashboard') {
      return (
        <DashboardScreen
          layout={dashboardLayout}
          dashboardKpis={dashboardKpis}
          blockedTasks={blockedTasks}
          pendingApprovals={pendingApprovals}
          tasksByColumn={tasksByColumn}
          messageFeed={messageFeed}
          agents={state.agents}
          agentsById={agentsById}
          taskOwnerCounts={taskOwnerCounts}
          onResetLayout={() => setDashboardLayout(createDefaultDashboardLayout())}
          onWidgetDragStart={setDraggedWidgetId}
          onWidgetDrop={handleWidgetDrop}
          onWidgetSizeCycle={handleWidgetSizeCycle}
        />
      );
    }

    if (activeScreen === 'work') {
      return (
        <WorkScreen
          taskTitle={taskTitle}
          taskDescription={taskDescription}
          taskPriority={taskPriority}
          taskKind={taskKind}
          taskRisk={taskRisk}
          isCreatingTask={isCreatingTask}
          updatingTaskId={updatingTaskId}
          draggedTaskId={draggedTaskId}
          tasksByColumn={tasksByColumn}
          agentsById={agentsById}
          onTaskTitleChange={setTaskTitle}
          onTaskDescriptionChange={setTaskDescription}
          onTaskPriorityChange={setTaskPriority}
          onTaskKindChange={setTaskKind}
          onTaskRiskChange={setTaskRisk}
          onCreateTask={handleCreateTask}
          onTaskDragStart={setDraggedTaskId}
          onTaskDropToStatus={handleTaskDropToStatus}
          onTaskStatusUpdate={handleTaskStatusUpdate}
        />
      );
    }

    if (activeScreen === 'agents') {
      return (
        <AgentsScreen
          agents={state.agents}
          selectedAgent={selectedAgent}
          agentDraft={agentDraft}
          isSavingAgent={isSavingAgent}
          onAgentSelect={handleAgentSelect}
          onAgentDraftChange={setAgentDraft}
          onSaveAgent={handleSaveAgent}
        />
      );
    }

    if (activeScreen === 'comms') {
      return (
        <CommsScreen
          agents={state.agents}
          agentsById={agentsById}
          messageFeed={messageFeed}
          chatRecipientId={chatRecipientId}
          chatText={chatText}
          isSendingMessage={isSendingMessage}
          onRecipientChange={setChatRecipientId}
          onChatTextChange={setChatText}
          onSendMessage={handleSendMessage}
        />
      );
    }

    if (activeScreen === 'runs') {
      return <RunsScreen activeRuns={activeRuns} pendingApprovals={pendingApprovals} />;
    }

    return <EventsScreen recentEvents={recentEvents} />;
  };

  return (
    <aside className={`control-center ${isCompact ? 'is-compact' : ''}`}>
      <header className="control-center-header">
        <h3>Command Center</h3>
        <p>Dashboard-first operations with fast switching across work, agents, chats, runs, and events.</p>
      </header>

      <nav className="control-screens">
        {SCREEN_ITEMS.map((item) => (
          <button key={item.id} type="button" className={activeScreen === item.id ? 'is-active' : ''} onClick={() => setActiveScreen(item.id)}>
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      {actionError ? <p className="control-error">{actionError}</p> : null}
      {actionSuccess ? <p className="control-success">{actionSuccess}</p> : null}

      {renderScreen()}
    </aside>
  );
}
