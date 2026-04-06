# Standardize Feature Log Location and Add Examples

## Goal
Set `docs/feature-log/` as the standard location for non-trivial task logs and add reference examples for feature logs, commit flow, and task decomposition.

## Scope
Included:
- update workflow documentation to use `docs/feature-log/` as the default standard location;
- add example documentation files under `docs/feature-log/`.

Out of scope:
- changes to product behavior or runtime code;
- changes to CI/CD or repository automation;
- migration of historical logs from other locations.

## Plan
- [x] Review current workflow and coding rule documents.
- [x] Create `docs/feature-log/` and add example documents.
- [x] Update rules to enforce `docs/feature-log/` as the standard place.
- [x] Validate changes and capture final result.

## Progress
- 2026-04-06: Reviewed `AGENTS.md`, `AGENT_RULES/CODING_RULES.md`, and `AGENT_RULES/TASK_WORKFLOW.md`.
- 2026-04-06: Created the feature-log directory and initial example documents.
- 2026-04-06: Updated `AGENTS.md` to explicitly set `docs/feature-log/` as the standard location.
- 2026-04-06: Updated `AGENT_RULES/TASK_WORKFLOW.md` to define standard location rules and add direct links to examples.
- 2026-04-06: Prepared commit-ready documentation changes with no runtime code impact.

## Validation
- `git diff --check`
- manual review of updated markdown documents for required sections and consistency

## Result
Completed:
- `docs/feature-log/` established as the documented standard location;
- one example feature log added;
- one example good commit flow added;
- one example task decomposition added.

Remaining:
- none.

## Files touched
- `docs/feature-log/2026-04-06-feature-log-location-and-examples.md`
- `docs/feature-log/example-good-commit-flow.md`
- `docs/feature-log/example-task-decomposition.md`
- `docs/feature-log/example-feature-log.md`
- `AGENTS.md`
- `AGENT_RULES/TASK_WORKFLOW.md`
