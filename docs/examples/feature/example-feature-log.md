# Add Approval Expiration Audit Event

## Goal
Emit a dedicated domain event when an approval request expires so expiration outcomes are observable in timeline views and audit exports.

## Scope
Included:
- add event contract for approval expiration;
- emit event from application flow when expiration is detected;
- add integration coverage for state + event assertions.

Out of scope:
- UI redesign for audit timeline;
- changes to approval policy thresholds;
- historical backfill for old approvals.

## Plan
- [x] Add new domain event type and payload schema.
- [x] Update use-case to publish event on transition to expired.
- [x] Extend integration test to validate persisted state and emitted event.
- [x] Update docs for event contract.

## Progress
- 2026-04-04: Added `approval.expired` event contract and payload validator.
- 2026-04-04: Updated approval-expiration use-case branch to publish event with run linkage metadata.
- 2026-04-04: Added integration assertion that duplicate expiration checks do not emit duplicate events.
- 2026-04-04: Documented new event in API/events reference.

## Validation
- `npm run typecheck`
- `npm run test -- approval-expiration.usecase.spec.ts`
- `npm run test -- approvals.integration.spec.ts`

## Result
Completed:
- expiration is now observable through a dedicated event;
- integration tests confirm state transition + event emission;
- idempotent re-check path does not produce duplicate events.

Remaining:
- none for this task.

## Files touched
- `src/domain/events/approval-events.ts`
- `src/application/use-cases/expire-approval.usecase.ts`
- `src/infrastructure/events/event-bus.ts`
- `test/integration/approvals.integration.spec.ts`
- `docs/events.md`
