import type { Agent, CompanyState, Task } from '../../types/domain';
import type { DashboardScreen, DashboardWidgetId } from './dashboard-layout';

export type AgentDraft = {
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

export interface ControlCenterProps {
  state: CompanyState;
  isCompact: boolean;
  onRefresh: () => Promise<void>;
}

export const WORK_COLUMNS: Array<{ status: Task['status']; title: string }> = [
  { status: 'todo', title: 'Todo' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'blocked', title: 'Blocked' },
  { status: 'done', title: 'Done' },
];

export const SCREEN_ITEMS: Array<{ id: DashboardScreen; label: string; description: string }> = [
  { id: 'dashboard', label: 'Dashboard', description: 'Draggable command widgets' },
  { id: 'work', label: 'Work', description: 'Shared kanban and top tasks' },
  { id: 'agents', label: 'Agents', description: 'Agent control and tuning' },
  { id: 'comms', label: 'Comms', description: 'Channels and direct messaging' },
  { id: 'runs', label: 'Runs', description: 'Orchestration and approvals' },
  { id: 'events', label: 'Events', description: 'Audit stream and explainability' },
];

export const WIDGET_TITLES: Record<DashboardWidgetId, string> = {
  kpi: 'KPI Radar',
  blockers: 'Blockers',
  approvals: 'Approvals',
  kanban: 'Mini Kanban',
  chats: 'Live Chats',
  load: 'Agent Load',
  office: 'Office Pulse',
};
