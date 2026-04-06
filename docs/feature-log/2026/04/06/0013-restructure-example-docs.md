# Restructure Example Docs Into `docs/examples`

## Goal
Separate real task logs from educational examples by moving examples out of `docs/feature-log/` into dedicated example folders.

## Scope
Included:
- create `docs/examples/task/` and `docs/examples/feature/`;
- move existing example files into these folders;
- update rule references to new example paths.

Out of scope:
- changes to runtime or product behavior;
- renaming or altering real dated feature logs.

## Plan
- [x] Create task feature log entry for this reorganization.
- [x] Move example files into `docs/examples/*`.
- [x] Update documentation references to new paths.
- [x] Validate markdown and repository diff.

## Progress
- 2026-04-06: Confirmed examples currently live in `docs/feature-log/`.
- 2026-04-06: Started restructuring task with dedicated feature log.
- 2026-04-06: Created `docs/examples/task/` and `docs/examples/feature/`.
- 2026-04-06: Moved task examples and feature-log example into dedicated folders.
- 2026-04-06: Updated references in `AGENT_RULES/TASK_WORKFLOW.md` and adjusted historical feature-log notes to new paths.

## Validation
- `git diff --check`
- manual link/path verification

## Result
Completed:
- `docs/feature-log/` now contains only dated real task logs;
- examples are grouped by purpose under `docs/examples/task/` and `docs/examples/feature/`;
- workflow references point to new paths.

Remaining:
- none.

## Files touched
- `docs/feature-log/2026/04/06/0013-restructure-example-docs.md`
- `docs/examples/task/example-task-decomposition.md`
- `docs/examples/task/example-good-commit-flow.md`
- `docs/examples/task/example-task-log.md`
- `docs/examples/feature/example-feature-overview.md`
- `AGENT_RULES/TASK_WORKFLOW.md`
- `docs/feature-log/2026/04/06/0012-feature-log-location-and-examples.md`
