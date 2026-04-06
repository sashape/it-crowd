# Example: Task Decomposition for a Non-Trivial Change

## Task
Introduce structured handoff payload validation in the task assignment flow without changing unrelated orchestration behavior.

## Intake summary
- Goal: reject invalid handoff payloads early and return explainable validation errors.
- Scope: schema, use-case integration, repository payload typing, and tests.
- Constraints: keep policy logic out of route handlers and orchestrator internals.
- Risks: hidden fallback behavior, breaking existing payload compatibility.
- Validation strategy: typecheck + unit tests + one integration test for idempotent POST behavior.

## Decomposition
1. Domain and contracts
   - Add `StructuredHandoffPayload` type.
   - Add schema with required fields: `goal`, `context`, `expected_output`, `constraints`, `acceptance_criteria`, `deadline`.

2. Persistence/repository
   - Align repository payload typing with new contract.
   - Add explicit mapping for persisted handoff payload shape.

3. Application/orchestration
   - Validate payload at use-case boundary.
   - Return typed validation failure result for invalid payloads.

4. Transport/integration
   - Ensure route handler maps validation failure to a stable API response.
   - Keep route handler free of business decision logic.

5. Tests
   - Unit tests for schema validation and decision mapping.
   - Integration test for idempotent POST request with same `Idempotency-Key`.

6. Documentation and cleanup
   - Update feature log with progress, deviations, and checks.
   - Update contract docs with payload example.
