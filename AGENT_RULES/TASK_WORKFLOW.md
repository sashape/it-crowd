# TASK_WORKFLOW.md

## Purpose
This file defines how work must be executed for IT-CROWD v1.

Use it together with `AGENT.md`.
`AGENT.md` defines the top-level operating rules.
This file defines how to handle tasks, decompose work, maintain progress logs, commit intermediate results, and publish to GitHub.

If this file appears to conflict with `AGENT.md`, follow `AGENT.md`.

## Scope
These rules apply to non-trivial tasks.

A task is non-trivial if it includes at least one of the following:
- changes in more than one module,
- schema or repository changes,
- API or event contract changes,
- orchestration or policy changes,
- new workflow behavior,
- multiple logical implementation steps,
- tests beyond a tiny localized change.

For trivial local edits, full decomposition and feature-log discipline may be lighter, but changes should still remain reviewable and validated.

## Core principles
- Decompose non-trivial work before coding.
- Keep progress visible in repository artifacts.
- Commit working intermediate states.
- Prefer a sequence of small valid steps over one large opaque patch.
- Keep the branch understandable at all times.
- Preserve auditability: another engineer should be able to see what was planned, what changed, and what remains.

## Task intake rules
Before implementing a non-trivial task, identify:
- goal,
- scope,
- affected modules,
- constraints,
- risks,
- expected outputs,
- validation strategy.

If the task is multi-step, create a decomposition before making substantial code changes.

## Decomposition rules
For non-trivial work, decompose the task into concrete implementation steps.

A good decomposition should:
- be implementation-oriented,
- separate domain changes from infrastructure changes,
- separate schema work from application logic,
- separate backend behavior from UI work when relevant,
- identify testing work explicitly,
- define a sensible execution order.

Preferred decomposition shape:
1. domain and contract changes,
2. persistence or schema changes,
3. application or orchestration logic,
4. transport or integration updates,
5. tests,
6. documentation and cleanup.

Do not create fake decomposition. Steps must correspond to real implementation work.

## Feature log requirement
Every non-trivial task must have a markdown feature log.

Standard location:
- `docs/feature-log/`

Alternative locations should be used only when a repository already has a documented legacy convention.

Preferred file naming:
- `YYYY-MM-DD-short-feature-name.md`
- or `feature-short-name.md` if the repository already has a clear convention

The feature log must be created early and updated during the task, not only at the end.

Reference examples:
- `docs/feature-log/example-feature-log.md`
- `docs/feature-log/example-good-commit-flow.md`
- `docs/feature-log/example-task-decomposition.md`

## Feature log template
Each feature log should contain these sections:

### Title
Short human-readable task name.

### Goal
What is being implemented or changed.

### Scope
What is included and what is explicitly out of scope.

### Plan
A short decomposition checklist of implementation steps.

### Progress
Chronological notes about:
- what was changed,
- what decisions were made,
- what constraints were discovered,
- what was deferred.

### Validation
What tests, checks, or manual verification were run.

### Result
What is complete, what remains, and any follow-up work.

### Files touched
Optional but recommended for larger tasks.

## Feature log writing rules
- Keep entries concise and factual.
- Write enough context for another engineer to continue the work.
- Record important architectural or contract decisions.
- Record deviations from the original plan.
- Record blockers and partial completion honestly.
- Do not use the log as a scratchpad for raw chain-of-thought.
- Do not include secrets, credentials, or tokens.

## Implementation sequencing rules
Preferred execution sequence for a non-trivial task:
1. understand the task,
2. create or update the feature log,
3. write the decomposition,
4. implement the first coherent substep,
5. run the most relevant validation,
6. commit the working intermediate result,
7. update the feature log,
8. continue with the next substep,
9. finish with tests, documentation updates, and final cleanup if needed.

Do not postpone all documentation and commits until the very end.

## Intermediate commit rules
Create intermediate commits for meaningful progress on non-trivial work.

Intermediate commits are expected when:
- a coherent substep is complete,
- a migration is added and validated,
- a domain model slice is implemented,
- a policy or orchestration step is implemented and checked,
- a relevant test slice is passing,
- a refactor required by the task is complete and stable.

Do not keep a large amount of coherent progress uncommitted without a good reason.

## Minimum validation before intermediate commits
An intermediate commit should usually follow the most relevant available validation for that step.

Examples:
- typecheck for affected package,
- lint on touched files,
- unit tests for changed module,
- one integration test for a new flow,
- migration validation when schema changed.

Not every intermediate commit requires the full test suite, but do not create long chains of unvalidated commits when local validation is feasible.

## Good intermediate commit criteria
A good intermediate commit is:
- coherent,
- limited in scope,
- understandable from the message,
- buildable when practical,
- testable when practical.

Examples:
- `feat(tasks): add task phase enum and repository support`
- `feat(policy): validate structured handoff payloads`
- `test(orchestrator): cover review to reopened transition`

Avoid messages like:
- `misc updates`
- `fix stuff`
- `wip`
- `changes`

## Commit message rules
Use clear conventional-style commit messages where practical.

Preferred format:
- `feat(scope): summary`
- `fix(scope): summary`
- `refactor(scope): summary`
- `test(scope): summary`
- `docs(scope): summary`
- `chore(scope): summary`

Commit messages should describe the repository change, not the effort spent.

## Commit content rules
Each commit should ideally represent one of:
- domain model step,
- schema or repository step,
- use-case or orchestration step,
- API or event contract step,
- test coverage step,
- documentation step.

Do not mix unrelated concerns in one commit unless necessary to keep the repository working.

## Git workflow rules
- Work on the current task branch unless the repository defines another branching strategy.
- Keep the branch focused on one task or one tightly related slice of work.
- Commit after each coherent validated step.
- Keep the working tree clean or intentionally staged before publishing.
- Do not rewrite shared history unless explicitly requested.
- Do not force-push unless explicitly requested and safe for the workflow.

## GitHub publishing rules
Push to GitHub only when one of these is true:
- the task explicitly includes publishing,
- the repository workflow clearly expects pushing intermediate or final work,
- the user explicitly asked for a push.

Before pushing, ensure:
- the feature log exists and is updated,
- relevant validation has been run,
- commit history is understandable,
- the branch is reviewable,
- no temporary debug code remains,
- no secrets or local-only config files are included.

Do not push just because local work exists.

## Before push checklist
Before pushing to GitHub, verify:
- implementation matches task scope,
- feature log is updated,
- relevant tests and checks were run,
- no temporary debugging artifacts remain,
- no secrets are included,
- commit history is understandable,
- branch state is reviewable.

## Rules for large tasks
For larger tasks, split work into stages and commit each stage separately.

Preferred stage structure:
- Stage 1: contracts and domain types
- Stage 2: schema and repository changes
- Stage 3: use-case or orchestration logic
- Stage 4: API and event integration
- Stage 5: tests and documentation

The feature log should reflect these stages.

## Rules for partial completion
If the task cannot be fully completed, you must still:
- update the feature log,
- commit any coherent valid partial work,
- clearly record what is done,
- clearly record what remains,
- clearly record blockers and uncertainties,
- leave the branch in a reviewable state if publishing is expected.

Do not leave invisible partial progress.

## Forbidden task-handling patterns
Do not:
- treat large work as one undocumented patch,
- skip decomposition for multi-step changes,
- skip the feature log for non-trivial work,
- keep progress only in memory,
- postpone all commits until the very end,
- push a branch with unexplained changes,
- publish broken code when a stable intermediate state was possible,
- use raw chain-of-thought as project documentation.

## Default operating rule
For any non-trivial task:
- decompose it,
- create or update the feature log,
- implement in coherent steps,
- validate each step,
- commit meaningful intermediate progress,
- and push only when the branch is understandable, reviewable, and expected to be published.
