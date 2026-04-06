# CODING_RULES.md

## Purpose
This file defines implementation rules for IT-CROWD v1.

Use it together with `AGENT.md`.
`AGENT.md` defines mission, architecture boundaries, and mandatory workflow expectations.
This file defines how code must be written, structured, validated, tested, and reviewed.

## Scope
These rules apply when changing:
- domain models,
- orchestration logic,
- policy logic,
- repositories and persistence,
- API handlers and contracts,
- event emission,
- runtime adapters,
- validation schemas,
- tests.

## Change discipline
Make the smallest clean change that solves the task.

You must:
- keep changes local when possible,
- preserve existing architecture boundaries,
- avoid unrelated refactors,
- avoid unnecessary renames or file moves,
- avoid changing public contracts unless the task explicitly requires it,
- prefer extending existing patterns over inventing new abstractions.

Do not mix feature work, broad refactoring, and cosmetic cleanup in one change unless necessary to keep the code correct.

## TypeScript rules
- Use strict TypeScript.
- Do not use `any` unless there is no reasonable alternative and the reason is explicit.
- Prefer `unknown` with narrowing for untrusted values.
- Use explicit domain types and enums.
- Prefer explicit return types for exported and public functions.
- Model optionality explicitly.
- Avoid stringly typed domain logic when an enum or typed value is appropriate.

## Function and module design
- Keep functions small and focused.
- One function should have one primary responsibility.
- Keep side effects explicit.
- Prefer pure functions for validation, mapping, and decision logic.
- Do not mix transport, domain, and persistence concerns in one function or file.
- Avoid “god services” that know too much.
- If a file starts mixing routing, orchestration, policy, and persistence, split it.

## Architecture rules

### Route handlers
Route handlers must:
- validate request input,
- call a use-case or application service,
- map results to HTTP responses.

Route handlers must not:
- contain business rules,
- call the database directly,
- implement orchestration logic,
- make policy decisions.

### Use-cases
Use-cases coordinate business flows.
They may:
- load state,
- call policy engine,
- call orchestrator components,
- persist changes,
- publish domain events.

Use-cases should remain focused on one business action.

### Orchestrator
The orchestrator coordinates workflow, task progression, and run progression.

The orchestrator must not:
- embed policy rules,
- silently override policy decisions,
- contain direct transport concerns,
- hide side effects from the event model.

### Policy Engine
The Policy Engine evaluates rules and returns structured outcomes.

The Policy Engine:
- decides whether an action is allowed,
- decides whether approval is required,
- evaluates quotas, limits, and transition permissions,
- returns explainable rule outcomes.

It should not become a general-purpose service layer.

### Runtime Adapter
Runtime adapters execute runtime work and report outcomes.

Runtime adapters must not:
- contain business decisions,
- own orchestration logic,
- decide approval behavior,
- mutate domain state outside explicit application flows.

### Repositories
Repositories own persistence access.

Use repositories for:
- loading state,
- persisting aggregates or records,
- encapsulating query logic.

Do not access the database directly from route handlers or UI-facing code.

## Domain modeling rules
- Prefer explicit domain entities and value types when useful.
- Keep domain state transitions deterministic.
- Reuse shared event envelope fields and event naming conventions.
- Represent policy outcomes with structured objects, not booleans only.
- Keep message and handoff payloads as validated contracts.
- Keep task, approval, and orchestration run logic as state-machine-like flows.

## Schema and validation rules
Validate all external and structured inputs.

This includes:
- HTTP request bodies,
- path and query params when they affect logic,
- handoff payloads,
- structured message payloads,
- approval decisions,
- event payloads generated from variable inputs.

Rules:
- schema and type definitions must stay aligned,
- if payload contract changes, update schema, type, and tests together,
- invalid input must fail explicitly,
- do not silently coerce invalid structured input into acceptable state.

## Error handling rules
- Do not use generic thrown errors for expected domain outcomes.
- Use typed domain errors or typed result objects.
- Distinguish clearly between:
  - validation failure,
  - policy rejection,
  - runtime failure,
  - infrastructure failure.
- Policy rejection is not a crash.
- Important failures must be observable through logs and/or domain events where appropriate.

## Event rules
- All meaningful side effects should emit domain events when relevant to UI, auditing, or orchestration.
- Use a consistent event envelope.
- Preserve required metadata such as timestamps, run linkage, and identifiers.
- Do not emit semantically duplicate events for the same logical action.
- Keep event payloads compact but useful.

## Idempotency rules
All POST endpoints must preserve idempotency.

Required rules:
- Require `Idempotency-Key` where the API contract says it is mandatory.
- The same semantic POST request with the same key must not create duplicate side effects.
- Idempotency applies to:
  - persisted state,
  - task creation,
  - message creation,
  - approval actions,
  - event emission chains.
- If POST behavior changes, add or update integration tests for idempotency.

## Handoff rules
Handoffs are structured work contracts.

A valid handoff payload must contain:
- `goal`
- `context`
- `expected_output`
- `constraints`
- `acceptance_criteria`
- `deadline`

Rules:
- do not replace structured handoff payloads with loose text,
- do not bypass validation for convenience,
- do not weaken handoff requirements silently.

## Approval rules
- Risky actions must either be blocked by policy or converted into approval flows.
- Approval expiration behavior must remain explicit and testable.
- Approval state changes must be reflected in persisted state and events.
- If approval-related behavior changes, update tests and event expectations together.

## Deterministic mock rules
The system must remain runnable in deterministic mock mode without external LLM keys.

Rules:
- deterministic mock behavior must be stable for the same inputs,
- tests must not depend on live provider behavior,
- live-provider logic must not leak into deterministic mode,
- core happy-path workflow must remain reproducible in deterministic mode.

## Database and migration rules
- Keep migrations focused and minimal.
- Prefer additive schema changes when practical.
- Do not combine schema changes with unrelated cleanup.
- When schema changes affect business logic, update:
  - types,
  - repositories,
  - validation,
  - tests.
- Add indexes based on actual query patterns, not guesswork.
- Preserve backward-compatible reads where possible during incremental evolution.

## Testing rules

### Required coverage
Add or update tests for changes in:
- task state transitions,
- orchestration run lifecycle,
- policy decisions,
- handoff validation,
- approval expiration,
- idempotent POST behavior,
- event emission,
- deterministic mock routing.

### Test levels
Use the lowest reliable test level that covers the risk:
- unit tests for pure decision logic and state transitions,
- integration tests for persistence, events, idempotency, and workflow behavior,
- E2E tests only for critical end-to-end confidence.

### Integration test expectations
When relevant, integration tests should verify:
- returned result,
- persisted state,
- emitted events,
- run linkage,
- absence of duplicate side effects.

### Bugfix rule
When fixing a bug, add a regression test when practical.

## Review checklist
Before considering implementation complete, verify:
- Is the change scoped and minimal?
- Are architecture boundaries preserved?
- Is policy logic outside the orchestrator?
- Is transport logic free of business logic?
- Are types explicit and aligned with schemas?
- Are structured payloads validated?
- Are meaningful side effects observable?
- Is idempotency preserved?
- Are tests added or updated where required?
- Does deterministic mock mode remain predictable?

## Forbidden patterns
Do not:
- use `any` without strong justification,
- put business logic in route handlers,
- put policy logic in orchestrator or adapters,
- bypass schema validation for structured payloads,
- add silent fallbacks that change domain behavior invisibly,
- perform direct database access from transport code,
- add broad unrelated refactors,
- create generic abstractions earlier than needed,
- expose raw internal reasoning where summaries are expected.

## Naming guidance
- Use names that reflect domain meaning.
- Avoid vague names such as `data`, `info`, `stuff`, `managerUtil`, `misc`.
- Prefer names like:
  - `ApprovalDecision`
  - `PolicyOutcome`
  - `TaskPhase`
  - `OrchestrationRun`
  - `StructuredHandoffPayload`
- Keep file names aligned with actual responsibility.

## Final principle
Favor clarity, determinism, observability, and architecture over shortcuts.
A smaller correct change that fits the system is better than a clever change that weakens the design.