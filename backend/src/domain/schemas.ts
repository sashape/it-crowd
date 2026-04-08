import { z } from 'zod';
import {
  AgentStatusValues,
  ApprovalTypeValues,
  ApprovalUrgencyValues,
  LlmModeValues,
  LlmProviderValues,
  MessageTypeValues,
  RiskLevelValues,
  RuntimeKindValues,
  TaskKindValues,
  TaskPhaseValues,
  TaskStatusValues,
} from '~/domain/enums.js';

export const BootstrapCompanySchema = z.object({
  company_name: z.string().min(2),
  company_prompt: z.string().min(20),
  language: z.enum(['ru', 'en']).default('ru'),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  kind: z.enum(TaskKindValues).default('implementation'),
  risk_level: z.enum(RiskLevelValues).default('medium'),
  requested_by: z.string().min(1),
});

export const UpdateTaskSchema = z.object({
  status: z.enum(TaskStatusValues).optional(),
  current_phase: z.enum(TaskPhaseValues).optional(),
  summary: z.string().min(1).optional(),
});

export const UpdateAgentSchema = z.object({
  role: z.enum(['pm', 'tl', 'be', 'fe', 'qa']).optional(),
  name: z.string().min(1).optional(),
  manager_agent_id: z.string().uuid().nullable().optional(),
  status: z.enum(AgentStatusValues).optional(),
  model_profile: z.string().min(1).optional(),
  runtime_kind: z.enum(RuntimeKindValues).optional(),
  delegation_limit: z.number().int().min(0).max(20).optional(),
  specialization_hint: z.string().min(1).optional(),
  responsibilities: z.array(z.string().min(1)).optional(),
  tool_policy: z.record(z.string(), z.unknown()).optional(),
});

export const HandoffPayloadSchema = z.object({
  goal: z.string().min(1),
  context: z.string().min(1),
  expected_output: z.string().min(1),
  constraints: z.string().min(1),
  acceptance_criteria: z.string().min(1),
  deadline: z.string().min(1),
});

export const CreateMessageSchema = z.object({
  run_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  thread_id: z.string().min(1),
  message_type: z.enum(MessageTypeValues),
  sender_type: z.enum(['human', 'agent', 'system']),
  sender_agent_id: z.string().uuid().optional(),
  content: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  mentioned_agent_id: z.string().uuid().optional(),
  requires_response: z.boolean().default(false),
});

export const DecideApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  decision_by: z.string().min(1),
  decision_reason: z.string().min(1),
});

export const TaskArtifactSchema = z.object({
  artifact_type: z.string().min(1),
  title: z.string().min(1),
  uri_or_inline: z.string().min(1),
  produced_by_agent_id: z.string().uuid(),
  task_id: z.string().uuid(),
  created_at: z.string().min(1),
});

export const ConfigSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LLM_MODE: z.enum(LlmModeValues).default('mock_deterministic'),
  LLM_PROVIDER: z.enum(LlmProviderValues).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const CreateApprovalSchema = z.object({
  approval_type: z.enum(ApprovalTypeValues),
  urgency: z.enum(ApprovalUrgencyValues),
});

export type BootstrapCompanyInput = z.infer<typeof BootstrapCompanySchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type DecideApprovalInput = z.infer<typeof DecideApprovalSchema>;
export type AppConfigInput = z.infer<typeof ConfigSchema>;
