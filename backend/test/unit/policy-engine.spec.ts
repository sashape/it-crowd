import { describe, expect, it } from 'vitest';
import { PolicyEngine } from '../../src/application/policy/policy-engine.js';

describe('PolicyEngine', () => {
  const engine = new PolicyEngine();

  it('enforces delegation and subtask limits', () => {
    expect(engine.canCreateSubtasks(3, 1).allowed).toBe(false);
    expect(engine.canCreateSubtasks(1, 7).allowed).toBe(false);
    expect(engine.canCreateSubtasks(1, 3).allowed).toBe(true);
  });

  it('enforces message and reopen limits', () => {
    expect(engine.canSendAgentMessage(12).allowed).toBe(false);
    expect(engine.canSendAgentMessage(3).allowed).toBe(true);
    expect(engine.canReopenTask(2).allowed).toBe(false);
    expect(engine.canReopenTask(1).allowed).toBe(true);
  });

  it('requests approval for risky actions', () => {
    expect(
      engine.evaluateRiskyAction({ kind: 'external_action', riskLevel: 'low' } as never).approvalRequired,
    ).toBe(true);
    expect(engine.evaluateRiskyAction({ kind: 'implementation', riskLevel: 'high' } as never).approvalRequired).toBe(true);
    expect(engine.evaluateRiskyAction({ kind: 'implementation', riskLevel: 'low' } as never).approvalRequired).toBe(false);
  });
});