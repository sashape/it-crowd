import type { Agent, Approval, Message, Task } from '../../../types/domain';
import type { DashboardLayoutState, DashboardWidgetId } from '../dashboard-layout';
import { WORK_COLUMNS, WIDGET_TITLES } from '../control-center-config';
import { formatDateTime, formatSender } from '../control-center-utils';

interface DashboardKpis {
  inProgress: number;
  blocked: number;
  approvalsPending: number;
  activeAgents: number;
}

interface DashboardScreenProps {
  layout: DashboardLayoutState;
  dashboardKpis: DashboardKpis;
  blockedTasks: Task[];
  pendingApprovals: Approval[];
  tasksByColumn: Map<Task['status'], Task[]>;
  messageFeed: Message[];
  agents: Agent[];
  agentsById: Map<string, Agent>;
  taskOwnerCounts: Map<string, number>;
  onResetLayout: () => void;
  onWidgetDragStart: (widgetId: DashboardWidgetId) => void;
  onWidgetDrop: (widgetId: DashboardWidgetId) => void;
  onWidgetSizeCycle: (widgetId: DashboardWidgetId) => void;
}

function renderWidgetBody(widgetId: DashboardWidgetId, props: DashboardScreenProps): JSX.Element {
  const {
    agents,
    agentsById,
    blockedTasks,
    dashboardKpis,
    messageFeed,
    pendingApprovals,
    taskOwnerCounts,
    tasksByColumn,
  } = props;

  if (widgetId === 'kpi') {
    return (
      <div className="dashboard-kpi-grid">
        <div>
          <strong>{dashboardKpis.inProgress}</strong>
          <span>In Progress</span>
        </div>
        <div>
          <strong>{dashboardKpis.blocked}</strong>
          <span>Blocked</span>
        </div>
        <div>
          <strong>{dashboardKpis.approvalsPending}</strong>
          <span>Approvals</span>
        </div>
        <div>
          <strong>{dashboardKpis.activeAgents}</strong>
          <span>Agents Online</span>
        </div>
      </div>
    );
  }

  if (widgetId === 'blockers') {
    return (
      <ul className="dashboard-list">
        {blockedTasks.length === 0 ? <li>No blockers right now.</li> : null}
        {blockedTasks.map((task) => (
          <li key={task.id}>
            <p>{task.title}</p>
            <small>{agentsById.get(task.ownerAgentId ?? '')?.name ?? 'Unassigned'}</small>
          </li>
        ))}
      </ul>
    );
  }

  if (widgetId === 'approvals') {
    return (
      <ul className="dashboard-list">
        {pendingApprovals.length === 0 ? <li>No pending approvals.</li> : null}
        {pendingApprovals.map((approval) => (
          <li key={approval.id}>
            <p>{approval.taskId}</p>
            <small>
              {approval.urgency} · expires {formatDateTime(approval.expiresAt)}
            </small>
          </li>
        ))}
      </ul>
    );
  }

  if (widgetId === 'kanban') {
    return (
      <div className="mini-kanban-metrics">
        {WORK_COLUMNS.map((column) => (
          <div key={column.status}>
            <strong>{tasksByColumn.get(column.status)?.length ?? 0}</strong>
            <span>{column.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (widgetId === 'chats') {
    return (
      <ul className="dashboard-list">
        {messageFeed.slice(0, 5).map((message) => (
          <li key={message.id}>
            <p>{formatSender(message, agentsById)}</p>
            <small>{message.content.slice(0, 82)}</small>
          </li>
        ))}
        {messageFeed.length === 0 ? <li>No chat activity yet.</li> : null}
      </ul>
    );
  }

  if (widgetId === 'load') {
    return (
      <ul className="dashboard-list">
        {agents.map((agent) => (
          <li key={agent.id}>
            <p>
              {agent.name} ({agent.role.toUpperCase()})
            </p>
            <small>active tasks: {taskOwnerCounts.get(agent.id) ?? 0}</small>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="office-pulse-widget">
      <p>Idle: {agents.filter((agent) => agent.status === 'idle').length}</p>
      <p>Busy: {agents.filter((agent) => agent.status === 'busy').length}</p>
      <p>Blocked: {agents.filter((agent) => agent.status === 'blocked').length}</p>
    </div>
  );
}

export function DashboardScreen(props: DashboardScreenProps): JSX.Element {
  const { layout, onResetLayout, onWidgetDragStart, onWidgetDrop, onWidgetSizeCycle } = props;

  return (
    <section className="control-pane">
      <div className="dashboard-toolbar">
        <h4>Founder Dashboard</h4>
        <button type="button" className="control-secondary" onClick={onResetLayout}>
          Reset Layout
        </button>
      </div>
      <p className="pane-subtitle">Drag widgets to reorder and click size to cycle S/M/L/XL.</p>

      <div className="dashboard-grid">
        {layout.order.map((widgetId) => (
          <article
            key={widgetId}
            className={`dashboard-widget size-${layout.sizes[widgetId]}`}
            draggable
            onDragStart={() => onWidgetDragStart(widgetId)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onWidgetDrop(widgetId)}
          >
            <header>
              <h5>{WIDGET_TITLES[widgetId]}</h5>
              <div className="widget-actions">
                <span className="drag-hint">drag</span>
                <button type="button" className="control-secondary" onClick={() => onWidgetSizeCycle(widgetId)}>
                  size: {layout.sizes[widgetId].toUpperCase()}
                </button>
              </div>
            </header>
            {renderWidgetBody(widgetId, props)}
          </article>
        ))}
      </div>
    </section>
  );
}

