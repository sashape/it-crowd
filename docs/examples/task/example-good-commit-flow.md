# Example: Good Commit Flow for a Non-Trivial Backend Task

## Scenario
Task: add approval expiration handling with observable domain events and preserved POST idempotency.

## Commit flow
1. `feat(domain): add approval expiration event contract`
   - Change: add event type, payload schema, and domain type.
   - Validation: `npm run typecheck`.

2. `feat(usecase): emit approval expired event from expiration flow`
   - Change: update use-case logic and event publishing path.
   - Validation: `npm run test -- approval-expiration.usecase.spec.ts`.

3. `test(integration): cover approval expiration state and event linkage`
   - Change: integration test for persisted state, emitted event, and no duplicate side effects.
   - Validation: `npm run test -- approvals.integration.spec.ts`.

4. `docs(events): document approval.expired payload`
   - Change: update event contract docs and usage notes.
   - Validation: manual doc review.

5. `docs(feature-log): record completion and validation evidence`
   - Change: update feature log with progress, checks, and final result.
   - Validation: `git diff --check`.

## Why this flow is good
- Each commit is coherent and reviewable.
- Domain contracts land before orchestration behavior.
- Tests are added at the step where behavior changes.
- Documentation and feature-log updates preserve traceability.
