# Pixel Office Main Screen v1

## Goal
Implement the IT-CROWD frontend main screen as a retro-future pixel office with live backend data, moving agents, and speech bubbles.

## Scope
Included:
- scaffold frontend with React + TypeScript + Vite + PixiJS;
- bootstrap-first UX, then office scene;
- scene-first 70/30 layout with mobile adaptation;
- backend extension for `messages` in `GET /api/company/state`;
- websocket `message.posted` payload excerpt for live speech bubbles;
- deterministic frontend presence projection from tasks/events/messages;
- waypoint movement and bubble queue/TTL;
- tests for backend contract and frontend logic.

Out of scope:
- multiplayer or multi-tenant mode;
- pathfinding/grid AI movement;
- audio effects and drag-drop office control.

## Plan
- [x] Create frontend scaffold, design tokens, and root shell.
- [x] Extend backend state query and message event payload for speech text.
- [x] Add backend integration tests for new contract behavior.
- [x] Implement office scene with pixel-art assets and zones.
- [x] Implement presence projection, waypoint tweening, and speech bubbles.
- [x] Connect REST bootstrap/state + websocket stream.
- [x] Add frontend unit/integration tests.
- [x] Run validation and finalize docs/log.

## Progress
- 2026-04-08 22:15: Task intake completed, constraints reviewed (`AGENTS.md`, `CODING_RULES.md`, `TASK_WORKFLOW.md`).
- 2026-04-08 22:18: Backend extended: `GetCompanyStateUseCase` now supports `include=messages`, `message.posted` now emits `content_excerpt` + `sender_agent_id`.
- 2026-04-08 22:19: Added backend integration coverage for state include behavior and message event payload excerpt.
- 2026-04-08 22:29: Frontend scaffolded with Vite+React+TS+Pixi, bootstrap flow, office shell layout, and API client.
- 2026-04-08 22:30: Implemented pixel office scene, presence projection, waypoint movement, and bubble queue.
- 2026-04-08 22:31: Added frontend unit + integration tests and fixed tooling compatibility (`vite`/`vitest`, UTF-8 no BOM normalization).

## Validation
- `pnpm --filter it-crowd-backend test`
- `pnpm --filter it-crowd-backend typecheck`
- `pnpm --filter it-crowd-frontend typecheck`
- `pnpm --filter it-crowd-frontend test`
- `pnpm --filter it-crowd-frontend build`

## Result
Completed:
- backend API now exposes message history in company state when explicitly requested;
- live `message.posted` events provide safe short text for speech bubbles;
- new frontend main screen ships with bootstrap UX, retro-future pixel office scene, moving agents, speech bubbles, and side observability panels;
- frontend and backend test suites pass with added regression checks.

Remaining:
- optional optimization: split heavy Pixi chunk to reduce first-load JS size warning.

## Files touched
- `backend/src/application/use-cases/get-company-state.use-case.ts`
- `backend/src/application/use-cases/post-message.use-case.ts`
- `backend/src/application/container.ts`
- `backend/test/integration/messages.integration.spec.ts`
- `frontend/*` (new Vite React app shell, scene, projection, styles, tests)
- `package.json`
- `pnpm-lock.yaml`
- `docs/feature-log/2026/04/08/2215-pixel-office-main-screen.md`