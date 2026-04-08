# Control Center: Agents, Kanban, Chats

## Goal
Implement a dedicated control center where founder can configure each agent, manage a shared kanban board, and observe/send chats.

## Scope
Included:
- backend support for updating agent parameters;
- frontend control-center UI with three areas: agent management, kanban, chats;
- founder actions: create main task, update task status, send direct message to any agent;
- visibility of inter-agent messages in shared chat feed.

Out of scope:
- multi-tenant auth;
- complex chat threading semantics beyond existing message model;
- drag-and-drop kanban (v1 uses action controls).

## Plan
- [x] Add backend endpoint for agent parameter updates with validation and event emission.
- [x] Add integration test coverage for agent update and emitted event.
- [x] Add frontend API client methods for agent/task/chat control actions.
- [x] Build Control Center UI (Agents/Kanban/Chats) and wire to live state refresh.
- [x] Validate frontend and backend checks; update feature log.

## Progress
- 2026-04-08 23:41: Task started and feature log created.
- 2026-04-08 23:43: Backend extended with `PATCH /api/agents/:id`, `UpdateAgentUseCase`, repository update method, and `agent.updated` event.
- 2026-04-08 23:44: Added backend integration tests for successful agent update and self-manager validation failure.
- 2026-04-08 23:47: Added frontend control APIs (`updateAgent`, `createTask`, `updateTask`, `postMessage`) and expanded domain types for full agent parameters.
- 2026-04-08 23:48: Replaced side panel with full Control Center UI tabs: Agents, Kanban, Chats; wired founder actions with refresh flow.
- 2026-04-08 23:49: Validation completed for backend and frontend suites plus production frontend build.

## Validation
- `pnpm --filter it-crowd-backend typecheck`
- `pnpm --filter it-crowd-backend test`
- `pnpm --filter it-crowd-frontend typecheck`
- `pnpm --filter it-crowd-frontend test`
- `pnpm --filter it-crowd-frontend build`

## Result
Completed:
- founder can edit all supported agent parameters from UI;
- kanban supports creating top-level tasks and moving task status across board columns;
- chats panel shows team message feed and allows founder to write directly to any agent;
- backend emits `agent.updated` domain event for observability.

Remaining:
- optional: add drag-and-drop kanban and richer thread filtering as follow-up.

## Files touched
- `backend/src/domain/enums.ts`
- `backend/src/domain/schemas.ts`
- `backend/src/infrastructure/repositories/agent-repository.ts`
- `backend/src/application/use-cases/update-agent.use-case.ts`
- `backend/src/interfaces/http/routes/agent-routes.ts`
- `backend/src/application/container.ts`
- `backend/src/app.ts`
- `backend/test/integration/agents.integration.spec.ts`
- `frontend/src/types/domain.ts`
- `frontend/src/api/client.ts`
- `frontend/src/features/control-center/ControlCenter.tsx`
- `frontend/src/features/office/OfficeScreen.tsx`
- `frontend/src/styles.css`
- `frontend/src/App.integration.spec.tsx`
- `frontend/src/features/office/__tests__/presence.spec.ts`
- `docs/feature-log/2026/04/08/2341-control-center-agents-kanban-chat.md`