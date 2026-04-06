# Feature Log Time Mask and Date Folders

## Goal
Adopt a stricter feature-log storage convention with creation time in file names (`HHMM-slug.md`) and date-based folders (`docs/feature-log/YYYY/MM/DD/`), then migrate all existing logs to the new structure.

## Scope
Included:
- update workflow rules to document the new naming and folder format;
- move existing logs into year/month/day folders;
- rename existing logs to include time prefix;
- update references to moved files across docs.

Out of scope:
- runtime/backend behavior changes;
- CI automation for feature-log validation.

## Plan
- [x] Define target naming structure and directory layout.
- [x] Move and rename existing feature-log files.
- [x] Update rule documents to reflect the new convention.
- [x] Update references to old feature-log paths.
- [x] Validate consistency and capture final state.

## Progress
- 2026-04-07: Introduced `docs/feature-log/YYYY/MM/DD/HHMM-slug.md` convention and migrated all existing logs.
- 2026-04-07: Updated `AGENTS.md`, `AGENT_RULES/TASK_WORKFLOW.md`, and docs examples for the new format.
- 2026-04-07: Updated moved-link references in existing logs and documentation.

## Validation
- `git diff --check`
- `pnpm --filter it-crowd-backend typecheck`

## Result
Completed:
- all feature-log files are stored under `/YYYY/MM/DD/`;
- all feature-log files now include `HHMM-` time prefix;
- core rules now enforce the new path and naming mask;
- references in docs and historical logs were updated to new paths.

Remaining:
- none.

## Files touched
- `AGENTS.md`
- `AGENT_RULES/TASK_WORKFLOW.md`
- `docs/examples/README.md`
- `docs/examples/feature/example-feature-overview.md`
- `docs/feature-log/2026/04/06/*.md`
- `docs/feature-log/2026/04/07/*.md`
- `docs/feature-log/2026/04/07/0051-feature-log-time-mask-and-folders.md`
