# UI Map v1 and Dashboard IA

## Goal
Define a clear v1 information architecture for IT-CROWD frontend: screens, menus, entity management model, communication flows, and drag-and-drop dashboard behavior so the product is not visually and functionally cramped.

## Scope
Included:
- full screen map and global navigation model;
- required visibility blocks for founder daily work;
- entity management surfaces and editable fields;
- communication model (channels, DM, escalation);
- drag-and-drop interaction model for dashboard and kanban;
- visual direction for warm retro-future pixel style with practical UX constraints.

Out of scope:
- implementation of new React components;
- backend contract changes;
- design token migration in code;
- production-grade visual assets.

## Plan
- [x] Define global shell and navigation structure.
- [x] Specify each product screen (purpose, content, actions, states).
- [x] Specify entity management model and field-level visibility.
- [x] Define communication UX and cross-screen entry points.
- [x] Define drag-and-drop dashboard model and constraints.
- [x] Define visual style guardrails to keep UI readable.
- [x] Add delivery stages for implementation.

## Progress
- 2026-04-09: Created task log and decomposition for v1 UI map specification.
- 2026-04-09: Added `docs/product/ui-map-v1.md` with full screen map, menu model, entity fields, communication model, drag-and-drop rules, and visual direction.
- 2026-04-09: Included default and alternative split behavior (`50/50`, `focus scene`, `focus panels`) to address layout crowding concerns.

## Validation
- Documentation consistency review against current product scope.
- Manual review that proposed screens and entities align with existing v1 boundaries (single-tenant founder mode, shared kanban access, founder direct messaging).

## Result
Completed:
- Task decomposition is prepared.
- v1 UI map document is created and ready as implementation reference.
- Dashboard/office/work/comms interaction model is defined in one place.

Remaining:
- Convert `ui-map-v1` into low-fi wireframes for `Control Center`, `Work`, and `Comms`.

## Files touched
- `docs/feature-log/2026/04/09/0011-ui-map-v1-dashboard-ia.md`
- `docs/product/ui-map-v1.md`
