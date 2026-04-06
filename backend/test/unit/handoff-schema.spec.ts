import { describe, expect, it } from 'vitest';
import { HandoffPayloadSchema } from '../../src/domain/schemas.js';

describe('HandoffPayloadSchema', () => {
  it('accepts valid structured handoff payload', () => {
    const parsed = HandoffPayloadSchema.parse({
      goal: 'Ship task result',
      context: 'Parent task context',
      expected_output: 'Implementation summary',
      constraints: 'No breaking changes',
      acceptance_criteria: 'All checks pass',
      deadline: '2026-04-10T10:00:00Z',
    });

    expect(parsed.goal).toBe('Ship task result');
  });

  it('rejects invalid handoff payload', () => {
    const result = HandoffPayloadSchema.safeParse({
      goal: 'Missing fields',
    });

    expect(result.success).toBe(false);
  });
});