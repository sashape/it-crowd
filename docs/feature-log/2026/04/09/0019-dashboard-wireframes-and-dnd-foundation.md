# Dashboard Wireframes and Drag-Drop Foundation

## Goal
Implement the first practical UX iteration from `ui-map-v1`: low-fi wireframes in docs and a working frontend command center with dashboard-style navigation and drag-and-drop widget layout.

## Scope
Included:
- low-fi screen wireframes for `Control Center`, `Work`, `Comms`;
- frontend command-center information architecture with screen menu tabs;
- drag-and-drop widget reorder in `Control Center`;
- persisted dashboard layout preferences in browser storage;
- style tokens and layout updates to reduce visual crowding.

Out of scope:
- backend contract changes;
- new domain entities;
- advanced resize handles and collision engine;
- mobile-native gesture drag for widgets.

## Plan
- [x] Add low-fi wireframe documentation.
- [x] Refactor `ControlCenter` into screen-based command workspace.
- [x] Implement draggable widget dashboard with persistent layout.
- [x] Integrate `Work`, `Agents`, `Comms`, `Runs`, `Events` views in the same shell.
- [x] Update styling for spacious dashboard readability.
- [x] Run frontend validation (typecheck, tests, build).

## Progress
- 2026-04-09: Created task log with decomposition.
- 2026-04-09: Added `docs/product/wireframes-v1-lowfi.md` with low-fi structural maps for Control Center, Work, and Comms screens.
- 2026-04-09: Added dashboard layout module with deterministic reorder, size cycle, and localStorage persistence (`dashboard-layout.ts`).
- 2026-04-09: Added unit tests for dashboard layout parsing/reorder/size helpers (`dashboard-layout.spec.ts`).
- 2026-04-09: Rebuilt `ControlCenter` into a screen-based command workspace: `Dashboard`, `Work`, `Agents`, `Comms`, `Runs`, `Events`.
- 2026-04-09: Added drag-and-drop widget reordering and quick size switching on the dashboard view.
- 2026-04-09: Added task card drag-and-drop between kanban columns in `Work`.
- 2026-04-09: Updated styles for larger spacing, screen menu cards, dashboard widget grid, and responsive behavior.

## Validation
- `pnpm --filter it-crowd-frontend typecheck`
- `pnpm --filter it-crowd-frontend test`
- `pnpm --filter it-crowd-frontend build`

## Result
Completed:
- Low-fi wireframe docs prepared and committed.
- Dashboard IA implemented in frontend command panel.
- Drag-and-drop dashboard widgets implemented with persisted layout state.
- Shared Work/Agents/Comms/Runs/Events workspace integrated.
- Frontend validation passed (typecheck, tests, build).

Remaining:
- Further UX polishing and optional keyboard-accessible widget movement controls.

## Files touched
- `docs/feature-log/2026/04/09/0019-dashboard-wireframes-and-dnd-foundation.md`
- `docs/product/wireframes-v1-lowfi.md`
- `frontend/src/features/control-center/ControlCenter.tsx`
- `frontend/src/features/control-center/dashboard-layout.ts`
- `frontend/src/features/control-center/dashboard-layout.spec.ts`
- `frontend/src/styles.css`
