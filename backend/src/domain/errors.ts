export type DomainErrorCode =
  | 'VALIDATION_FAILED'
  | 'POLICY_REJECTED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RUNTIME_FAILURE'
  | 'INFRA_FAILURE';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details: Record<string, unknown>;

  public constructor(code: DomainErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
}