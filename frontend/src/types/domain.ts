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
  modelProfile: string;
  runtimeKind: 'mock_runtime' | 'openclaw';
  delegationLimit: number;
  specializationHint: string;
  responsibilities: string[];
  toolPolicy: Record<string, unknown>;
  createdAt: string;
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
  messageType: 'task_comment' | 'direct_message' | 'handoff' | 'escalation' | 'human_instruction' | 'system_notice';
  senderType: 'human' | 'agent' | 'system';
  senderAgentId: string | null;
  content: string;
  mentionedAgentId?: string | null;
  requiresResponse?: boolean;
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

export interface UpdateAgentPayload {
  role?: Agent['role'];
  name?: string;
  manager_agent_id?: string | null;
  status?: Agent['status'];
  model_profile?: string;
  runtime_kind?: Agent['runtimeKind'];
  delegation_limit?: number;
  specialization_hint?: string;
  responsibilities?: string[];
  tool_policy?: Record<string, unknown>;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  kind: 'analysis' | 'implementation' | 'review' | 'communication' | 'deployment' | 'external_action';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requested_by: string;
}

export interface CreateMessagePayload {
  run_id?: string;
  task_id?: string;
  thread_id: string;
  message_type: Message['messageType'];
  sender_type: 'human' | 'agent' | 'system';
  sender_agent_id?: string;
  content: string;
  payload?: Record<string, unknown>;
  mentioned_agent_id?: string;
  requires_response?: boolean;
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

