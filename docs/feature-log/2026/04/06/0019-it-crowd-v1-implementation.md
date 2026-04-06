# IT-CROWD v1 Implementation

## Goal
Implement the agreed IT-CROWD v1 specification as a runnable backend-first system with Postgres persistence, WebSocket events, policy-driven orchestration, idempotent POST semantics, deterministic mock mode, and architecture boundaries enforced in code.

## Scope
Included:
- backend monorepo bootstrap and TypeScript project setup;
- Postgres schema + migrations + repository layer;
- domain contracts for runs/tasks/messages/approvals/events/artifacts;
- policy engine, orchestrator, runtime adapter, LLM gateway;
- REST and WebSocket interfaces with idempotency enforcement;
- unit + integration tests for critical invariants;
- minimal frontend scaffold placeholder.

Out of scope:
- full OpenClaw container orchestration runtime;
- multi-tenant auth and ACL;
- production-grade frontend UX.

## Plan
- [x] Stage 1: Project scaffold + feature-log + base config.
- [x] Stage 2: Domain types, schemas, DB migration, repositories.
- [x] Stage 3: Policy engine, runtime adapter, LLM gateway, orchestrator/use-cases.
- [x] Stage 4: REST routes, WebSocket stream, idempotent POST wrapper.
- [x] Stage 5: Unit/integration tests and documentation polish.

## Progress
- 2026-04-06: Created repository scaffold for backend/frontend and root workspace config.
- 2026-04-06: Added full backend domain model and strict schemas for task/message/handoff/artifact contracts.
- 2026-04-06: Implemented Postgres schema and migration with runs, tasks, approvals, messages, events, and idempotency storage.
- 2026-04-06: Added repository layer and explicit application boundaries (use-cases, policy engine, orchestrator, runtime adapter).
- 2026-04-06: Implemented REST API, idempotent POST wrapper, and WebSocket event stream.
- 2026-04-06: Implemented approval expiry matrix behavior and event emission flow.
- 2026-04-06: Added unit tests for policy limits and schema contracts, plus integration tests for bootstrap/task lifecycle/messages/approval expiry.
- 2026-04-06: Resolved type/lint/test failures and stabilized deterministic mock test harness via pg-mem.

## Validation
- `npm run typecheck --workspace backend`
- `npm run lint --workspace backend`
- `npm run test --workspace backend`
- `npm run build --workspace backend`

## Result
Completed:
- runnable backend v1 aligned to final spec,
- persisted orchestration runs with outcomes,
- task ownership and phase model,
- strict message and handoff semantics with schema version,
- approval SLA expiration behavior with default matrix,
- idempotent POST behavior on bootstrap/tasks/messages/approval decisions,
- event-driven observability via persisted event log and websocket stream,
- deterministic mock mode validated end-to-end.

Remaining:
- real OpenClaw runtime adapter implementation (current runtime is mock/noop boundary),
- production frontend implementation (current frontend is placeholder),
- deployment hardening and operational dashboards.

## Files touched
- `package.json`
- `README.md`
- `backend/*`
- `frontend/*`
- `docs/feature-log/2026/04/06/0019-it-crowd-v1-implementation.md`