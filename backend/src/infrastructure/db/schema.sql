CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  language TEXT NOT NULL,
  blueprint_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  manager_agent_id UUID NULL,
  status TEXT NOT NULL,
  model_profile TEXT NOT NULL,
  runtime_kind TEXT NOT NULL,
  delegation_limit INTEGER NOT NULL,
  specialization_hint TEXT NOT NULL,
  responsibilities JSONB NOT NULL,
  tool_policy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_instruction_artifacts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  artifact_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS orchestration_runs (
  run_id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  outcome TEXT NULL,
  trigger_type TEXT NOT NULL,
  trigger_ref TEXT NULL,
  step_count INTEGER NOT NULL DEFAULT 0,
  warning_reason TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  current_phase TEXT NOT NULL,
  kind TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  requires_approval BOOLEAN NOT NULL,
  approval_policy_key TEXT NULL,
  parent_task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  depth INTEGER NOT NULL,
  creator_agent_id UUID NULL,
  owner_agent_id UUID NULL,
  reviewer_agent_id UUID NULL,
  assigned_by_agent_id UUID NULL,
  requested_by_human BOOLEAN NOT NULL,
  reopen_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT NULL,
  input_context JSONB NOT NULL,
  expected_output TEXT NOT NULL,
  done_criteria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS task_artifacts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  uri_or_inline TEXT NOT NULL,
  produced_by_agent_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_id UUID NULL,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  thread_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_schema_version INTEGER NOT NULL,
  sender_type TEXT NOT NULL,
  sender_agent_id UUID NULL,
  content TEXT NOT NULL,
  payload JSONB NOT NULL,
  mentioned_agent_id UUID NULL,
  requires_response BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  requested_by_agent_id UUID NOT NULL,
  urgency TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  decision_by TEXT NULL,
  decision_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS event_log (
  event_id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  trace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  caused_by_type TEXT NOT NULL,
  caused_by_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  ts TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  company_id UUID NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  request_key TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  response_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_company_status_priority ON tasks(company_id, status, risk_level);
CREATE INDEX IF NOT EXISTS idx_event_log_company_ts ON event_log(company_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_ts ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_company_status_expiry ON approvals(company_id, status, expires_at);
