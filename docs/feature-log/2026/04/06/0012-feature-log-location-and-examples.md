# Standardize Feature Log Location and Add Examples

## Goal
Set `docs/feature-log/YYYY/MM/DD/HHMM-short-feature-name.md` as the standard location pattern for non-trivial task logs and add reference examples for feature logs, commit flow, and task decomposition.

## Scope
Included:
- update workflow documentation to use `docs/feature-log/YYYY/MM/DD/` as the default standard location;
- add example documentation files under `docs/examples/`.

Out of scope:
- changes to product behavior or runtime code;
- changes to CI/CD or repository automation;
- migration of historical logs from other locations.

## Plan
- [x] Review current workflow and coding rule documents.
- [x] Create `docs/feature-log/` hierarchy and add example documents.
- [x] Update rules to enforce `docs/feature-log/YYYY/MM/DD/HHMM-short-feature-name.md` as the standard pattern.
- [x] Validate changes and capture final result.

## Progress
- 2026-04-06: Reviewed `AGENTS.md`, `AGENT_RULES/CODING_RULES.md`, and `AGENT_RULES/TASK_WORKFLOW.md`.
- 2026-04-06: Created the feature-log directory and initial example documents.
- 2026-04-06: Updated `AGENTS.md` to explicitly set `docs/feature-log/YYYY/MM/DD/` as the standard location.
- 2026-04-06: Updated `AGENT_RULES/TASK_WORKFLOW.md` to define standard location rules and add direct links to examples.
- 2026-04-06: Prepared commit-ready documentation changes with no runtime code impact.
- 2026-04-06: Moved example documents out of `docs/feature-log/` into `docs/examples/task/` and `docs/examples/feature/` to keep feature logs focused on real task logs.
- 2026-04-06: Updated workflow example links to new `docs/examples/*` paths.

## Validation
- `git diff --check`
- manual review of updated markdown documents for required sections and consistency

## Result
Completed:
- `docs/feature-log/YYYY/MM/DD/` established as the documented standard location;
- real task logs remain under the dated folder hierarchy in `docs/feature-log/`;
- examples are separated into `docs/examples/feature/` and `docs/examples/task/`.

Remaining:
- none.

## Files touched
- `docs/feature-log/2026/04/06/0012-feature-log-location-and-examples.md`
- `docs/examples/task/example-good-commit-flow.md`
- `docs/examples/task/example-task-decomposition.md`
- `docs/examples/task/example-task-log.md`
- `docs/examples/feature/example-feature-overview.md`
- `AGENTS.md`
- `AGENT_RULES/TASK_WORKFLOW.md`
