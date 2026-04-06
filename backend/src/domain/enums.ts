export const RunStatusValues = ['running', 'paused', 'finished'] as const;
export type RunStatus = (typeof RunStatusValues)[number];

export const RunOutcomeValues = [
  'completed',
  'stopped_by_policy',
  'stopped_by_human',
  'awaiting_approval',
  'failed_runtime',
  'failed_llm',
  'warning_only',
] as const;
export type RunOutcome = (typeof RunOutcomeValues)[number];

export const TaskStatusValues = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const;
export type TaskStatus = (typeof TaskStatusValues)[number];

export const TaskPhaseValues = [
  'intake',
  'planning',
  'execution',
  'review',
  'approval',
  'done',
  'blocked',
] as const;
export type TaskPhase = (typeof TaskPhaseValues)[number];

export const TaskKindValues = [
  'analysis',
  'implementation',
  'review',
  'communication',
  'deployment',
  'external_action',
] as const;
export type TaskKind = (typeof TaskKindValues)[number];

export const RiskLevelValues = ['low', 'medium', 'high', 'critical'] as const;
export type RiskLevel = (typeof RiskLevelValues)[number];

export const ApprovalStatusValues = ['pending', 'approved', 'rejected', 'expired'] as const;
export type ApprovalStatus = (typeof ApprovalStatusValues)[number];

export const ApprovalUrgencyValues = ['low', 'medium', 'high', 'critical'] as const;
export type ApprovalUrgency = (typeof ApprovalUrgencyValues)[number];

export const ApprovalTypeValues = ['external_action', 'quality_clarification', 'risk_override'] as const;
export type ApprovalType = (typeof ApprovalTypeValues)[number];

export const AgentStatusValues = ['idle', 'busy', 'blocked', 'offline'] as const;
export type AgentStatus = (typeof AgentStatusValues)[number];

export const MessageTypeValues = [
  'task_comment',
  'direct_message',
  'handoff',
  'escalation',
  'human_instruction',
  'system_notice',
] as const;
export type MessageType = (typeof MessageTypeValues)[number];

export const SenderTypeValues = ['human', 'agent', 'system'] as const;
export type SenderType = (typeof SenderTypeValues)[number];

export const RuntimeKindValues = ['mock_runtime', 'openclaw'] as const;
export type RuntimeKind = (typeof RuntimeKindValues)[number];

export const EventTypeValues = [
  'company.bootstrapped',
  'agent.created',
  'task.created',
  'task.decomposed',
  'task.assigned',
  'task.status_changed',
  'task.phase_changed',
  'task.review_requested',
  'task.reopened',
  'task.blocked',
  'message.posted',
  'agent.pinged_human',
  'approval.required',
  'approval.resolved',
  'approval.expired',
  'runtime.artifact_collected',
  'runtime.execution_failed',
  'orchestrator.warning',
] as const;
export type EventType = (typeof EventTypeValues)[number];

export const LlmModeValues = ['live_with_fallback', 'mock_static', 'mock_deterministic'] as const;
export type LlmMode = (typeof LlmModeValues)[number];

export const LlmProviderValues = ['openai', 'anthropic'] as const;
export type LlmProvider = (typeof LlmProviderValues)[number];