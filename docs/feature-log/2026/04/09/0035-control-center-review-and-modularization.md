# Control Center Review and Modularization

## Goal
Review `ControlCenter.tsx`, identify architectural and UX risks, and split the large component into smaller files with preserved behavior.

## Scope
Included:
- review findings for current `ControlCenter.tsx`;
- component split by screen/view responsibility;
- extraction of shared constants, types, and view helpers;
- keep existing frontend behavior and API contracts;
- run frontend checks after refactor.

Out of scope:
- backend API changes;
- redesign of domain workflows;
- CSS rewrite beyond what is needed for refactor compatibility.

## Plan
- [x] Record review findings with severity and references.
- [x] Extract shared constants/types/helpers.
- [x] Split screen rendering into separate files.
- [x] Keep container state/actions in `ControlCenter.tsx`.
- [x] Address critical UX reset risk discovered in review.
- [x] Validate with typecheck, tests, and build.

## Progress
- 2026-04-09: Started task and created implementation plan.
- 2026-04-09: Review finding (high): agent edit draft was overwritten on every state refresh cycle. Root cause was broad synchronization effect that reinitialized draft from server state.
- 2026-04-09: Review finding (medium): monolithic `ControlCenter.tsx` mixed container state, API side effects, all screen render trees, and formatting helpers in one file, increasing regression risk.
- 2026-04-09: Review finding (low): duplicate rendering and formatting logic across screen blocks reduced readability and made targeted testing harder.
- 2026-04-09: Extracted configuration and helper logic:
  - `frontend/src/features/control-center/control-center-config.ts`
  - `frontend/src/features/control-center/control-center-utils.ts`
- 2026-04-09: Split screen views:
  - `DashboardScreen.tsx`
  - `WorkScreen.tsx`
  - `AgentsScreen.tsx`
  - `CommsScreen.tsx`
  - `RunsScreen.tsx`
  - `EventsScreen.tsx`
- 2026-04-09: Reduced `ControlCenter.tsx` to container/orchestration role and fixed draft-reset behavior by only resetting agent draft on missing/invalid selection, not on every state update.

## Validation
- `pnpm --filter it-crowd-frontend typecheck`
- `pnpm --filter it-crowd-frontend test`
- `pnpm --filter it-crowd-frontend build`

## Result
Completed:
- Review findings documented and addressed.
- Control Center split into modular files by screen responsibility.
- Critical agent-draft reset issue fixed during refactor.
- Frontend validation passed.

Remaining:
- Optional: add focused unit tests for container state transitions (agent selection, drag/drop no-op, status banner lifecycle).

## Files touched
- `docs/feature-log/2026/04/09/0035-control-center-review-and-modularization.md`
- `frontend/src/features/control-center/ControlCenter.tsx`
- `frontend/src/features/control-center/control-center-config.ts`
- `frontend/src/features/control-center/control-center-utils.ts`
- `frontend/src/features/control-center/screens/DashboardScreen.tsx`
- `frontend/src/features/control-center/screens/WorkScreen.tsx`
- `frontend/src/features/control-center/screens/AgentsScreen.tsx`
- `frontend/src/features/control-center/screens/CommsScreen.tsx`
- `frontend/src/features/control-center/screens/RunsScreen.tsx`
- `frontend/src/features/control-center/screens/EventsScreen.tsx`
- `frontend/src/features/control-center/screens/index.ts`
