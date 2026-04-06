# Separate Task and Feature Example Semantics

## Goal
Remove semantic mixing between `task` and `feature` examples by keeping execution artifacts in task examples and product-level artifacts in feature examples.

## Scope
Included:
- move task-log style example into `docs/examples/task/`;
- add a true feature-level example under `docs/examples/feature/`;
- update references and explanatory docs.

Out of scope:
- runtime code or API behavior changes;
- changes to real task logs in `docs/feature-log/`.

## Plan
- [x] Capture this cleanup in a dedicated feature log.
- [x] Reclassify mixed example files by intent.
- [x] Update rule/example references.
- [x] Validate links and repository diff.

## Progress
- 2026-04-06: Confirmed `docs/examples/feature/example-feature-log.md` was task-log shaped and caused semantic overlap.
- 2026-04-06: Reclassified task-log example to `docs/examples/task/example-task-log.md`.
- 2026-04-06: Added true feature-level example `docs/examples/feature/example-feature-overview.md`.
- 2026-04-06: Updated workflow reference examples and examples README to describe strict task/feature separation.

## Validation
- `git diff --check`
- manual terminology/path review

## Result
Completed:
- task examples now contain only execution artifacts (`task log`, `decomposition`, `commit flow`);
- feature examples now contain feature-level planning artifacts (`feature overview`, `delivery slices`);
- rule references align with new separation.

Remaining:
- none.

## Files touched
- `docs/examples/README.md`
- `docs/examples/task/example-task-log.md`
- `docs/examples/feature/example-feature-overview.md`
- `AGENT_RULES/TASK_WORKFLOW.md`
- `docs/feature-log/2026-04-06-separate-task-and-feature-examples.md`
