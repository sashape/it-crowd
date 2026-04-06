import type {
  AgentStatus,
  ApprovalStatus,
  ApprovalType,
  ApprovalUrgency,
  EventType,
  MessageType,
  RiskLevel,
  RunOutcome,
  RunStatus,
  RuntimeKind,
  SenderType,
  TaskKind,
  TaskPhase,
  TaskStatus,
} from '~/domain/enums.js';

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
  status: AgentStatus;
  modelProfile: string;
  runtimeKind: RuntimeKind;
  delegationLimit: number;
  specializationHint: string;
  responsibilities: string[];
  toolPolicy: Record<string, unknown>;
  createdAt: string;
}

export interface OrchestrationRun {
  runId: string;
  companyId: string;
  status: RunStatus;
  outcome: RunOutcome | null;
  triggerType: 'bootstrap' | 'human_instruction' | 'task_update' | 'approval_decision';
  triggerRef: string | null;
  stepCount: number;
  warningReason: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: TaskStatus;
  currentPhase: TaskPhase;
  kind: TaskKind;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  approvalPolicyKey: string | null;
  parentTaskId: string | null;
  depth: number;
  creatorAgentId: string | null;
  ownerAgentId: string | null;
  reviewerAgentId: string | null;
  assignedByAgentId: string | null;
  requestedByHuman: boolean;
  reopenCount: number;
  summary: string | null;
  inputContext: Record<string, unknown>;
  expectedOutput: string;
  doneCriteria: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskArtifact {
  id: string;
  companyId: string;
  taskId: string;
  artifactType: string;
  title: string;
  uriOrInline: string;
  producedByAgentId: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  companyId: string;
  runId: string;
  taskId: string;
  approvalType: ApprovalType;
  targetType: 'task' | 'runtime_action';
  targetId: string;
  requestedByAgentId: string;
  urgency: ApprovalUrgency;
  expiresAt: string;
  status: ApprovalStatus;
  decisionBy: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  companyId: string;
  runId: string | null;
  taskId: string | null;
  threadId: string;
  messageType: MessageType;
  messageSchemaVersion: 1;
  senderType: SenderType;
  senderAgentId: string | null;
  content: string;
  payload: Record<string, unknown>;
  mentionedAgentId: string | null;
  requiresResponse: boolean;
  createdAt: string;
}

export interface DomainEvent {
  eventId: string;
  eventType: EventType;
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

export interface StructuredHandoffPayload {
  goal: string;
  context: string;
  expected_output: string;
  constraints: string;
  acceptance_criteria: string;
  deadline: string;
}