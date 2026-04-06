import type { Approval, Task } from '../../domain/models.js';
import type { ApprovalStatus, ApprovalType } from '../../domain/enums.js';
import type { DatabaseClient } from '../db/pool.js';

interface ApprovalRow {
  id: string;
  company_id: string;
  run_id: string;
  task_id: string;
  approval_type: ApprovalType;
  target_type: 'task' | 'runtime_action';
  target_id: string;
  requested_by_agent_id: string;
  urgency: Approval['urgency'];
  expires_at: string;
  status: ApprovalStatus;
  decision_by: string | null;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
}

function mapApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    companyId: row.company_id,
    runId: row.run_id,
    taskId: row.task_id,
    approvalType: row.approval_type,
    targetType: row.target_type,
    targetId: row.target_id,
    requestedByAgentId: row.requested_by_agent_id,
    urgency: row.urgency,
    expiresAt: row.expires_at,
    status: row.status,
    decisionBy: row.decision_by,
    decisionReason: row.decision_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ApprovalRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(approval: Approval): Promise<void> {
    await this.database.query(
      `INSERT INTO approvals (
        id, company_id, run_id, task_id, approval_type, target_type, target_id,
        requested_by_agent_id, urgency, expires_at, status, decision_by, decision_reason,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15
      )`,
      [
        approval.id,
        approval.companyId,
        approval.runId,
        approval.taskId,
        approval.approvalType,
        approval.targetType,
        approval.targetId,
        approval.requestedByAgentId,
        approval.urgency,
        approval.expiresAt,
        approval.status,
        approval.decisionBy,
        approval.decisionReason,
        approval.createdAt,
        approval.updatedAt,
      ],
    );
  }

  public async updateDecision(input: {
    id: string;
    status: 'approved' | 'rejected';
    decisionBy: string;
    decisionReason: string;
  }): Promise<void> {
    await this.database.query(
      `UPDATE approvals
       SET status = $2,
           decision_by = $3,
           decision_reason = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [input.id, input.status, input.decisionBy, input.decisionReason],
    );
  }

  public async expire(approvalId: string): Promise<void> {
    await this.database.query(
      `UPDATE approvals
       SET status = 'expired',
           updated_at = NOW()
       WHERE id = $1`,
      [approvalId],
    );
  }

  public async getById(approvalId: string): Promise<Approval | null> {
    const result = await this.database.query<ApprovalRow>(
      `SELECT id, company_id, run_id, task_id, approval_type, target_type, target_id,
              requested_by_agent_id, urgency, expires_at, status, decision_by, decision_reason,
              created_at, updated_at
       FROM approvals
       WHERE id = $1`,
      [approvalId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapApproval(result.rows[0]);
  }

  public async listByCompany(companyId: string): Promise<Approval[]> {
    const result = await this.database.query<ApprovalRow>(
      `SELECT id, company_id, run_id, task_id, approval_type, target_type, target_id,
              requested_by_agent_id, urgency, expires_at, status, decision_by, decision_reason,
              created_at, updated_at
       FROM approvals
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId],
    );

    return result.rows.map(mapApproval);
  }

  public async listExpiredPending(companyId: string, nowIso: string): Promise<Approval[]> {
    const result = await this.database.query<ApprovalRow>(
      `SELECT id, company_id, run_id, task_id, approval_type, target_type, target_id,
              requested_by_agent_id, urgency, expires_at, status, decision_by, decision_reason,
              created_at, updated_at
       FROM approvals
       WHERE company_id = $1
       AND status = 'pending'
       AND expires_at <= $2`,
      [companyId, nowIso],
    );

    return result.rows.map(mapApproval);
  }

  public async countByTask(taskId: string): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM approvals WHERE task_id = $1`,
      [taskId],
    );

    return Number(result.rows[0]?.count ?? '0');
  }

  public expiryMatrixTargetPhase(approvalType: ApprovalType): Task['currentPhase'] {
    if (approvalType === 'external_action' || approvalType === 'risk_override') {
      return 'blocked';
    }

    return 'review';
  }
}