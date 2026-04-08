export interface Company {
  id: string;
  name: string;
  prompt: string;
  language: 'ru' | 'en';
  blueprintStatus: 'blueprint_draft' | 'blueprint_confirmed';
  createdAt: string;
}

export interface Agent {
  id: string;
  companyId: string;
  role: 'pm' | 'tl' | 'be' | 'fe' | 'qa';
  name: string;
  managerAgentId: string | null;
  status: 'idle' | 'busy' | 'blocked' | 'offline';
  specializationHint: string;
  responsibilities: string[];
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  currentPhase: 'intake' | 'planning' | 'execution' | 'review' | 'approval' | 'done' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ownerAgentId: string | null;
  reviewerAgentId: string | null;
  updatedAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expiresAt: string;
  updatedAt: string;
}

export interface OrchestrationRun {
  runId: string;
  status: 'running' | 'paused' | 'finished';
  outcome:
    | 'completed'
    | 'stopped_by_policy'
    | 'stopped_by_human'
    | 'awaiting_approval'
    | 'failed_runtime'
    | 'failed_llm'
    | 'warning_only'
    | null;
  stepCount: number;
  warningReason: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Message {
  id: string;
  runId: string | null;
  taskId: string | null;
  threadId: string;
  messageType: string;
  senderType: 'human' | 'agent' | 'system';
  senderAgentId: string | null;
  content: string;
  createdAt: string;
}

export interface DomainEvent {
  eventId: string;
  eventType: string;
  companyId: string;
  runId: string;
  traceId: string;
  entityType: string;
  entityId: string;
  causedByType: 'human' | 'agent' | 'system';
  causedById: string;
  ts: string;
  payload: Record<string, unknown>;
}

export interface CompanyState {
  company: Company;
  agents: Agent[];
  tasks: Task[];
  approvals: Approval[];
  recent_events: DomainEvent[];
  runs: OrchestrationRun[];
  messages: Message[];
  active_run_id?: string | null;
  recent_run_ids?: string[];
}

export interface CompanyStateResponse extends Partial<CompanyState> {
  success: true;
}

export interface BootstrapPayload {
  company_name: string;
  company_prompt: string;
  language: 'ru' | 'en';
}

export interface DomainErrorResponse {
  success: false;
  code?: string;
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

export interface MessagePostedPayload {
  thread_id?: string;
  message_type?: string;
  message_schema_version?: number;
  task_id?: string | null;
  sender_agent_id?: string | null;
  content_excerpt?: string;
}

