import type { Task } from '../../domain/models.js';
import type { TaskPhase, TaskStatus } from '../../domain/enums.js';
import type { DatabaseClient } from '../db/pool.js';

interface TaskRow {
  id: string;
  company_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  current_phase: TaskPhase;
  kind: Task['kind'];
  risk_level: Task['riskLevel'];
  requires_approval: boolean;
  approval_policy_key: string | null;
  parent_task_id: string | null;
  depth: number;
  creator_agent_id: string | null;
  owner_agent_id: string | null;
  reviewer_agent_id: string | null;
  assigned_by_agent_id: string | null;
  requested_by_human: boolean;
  reopen_count: number;
  summary: string | null;
  input_context: Record<string, unknown>;
  expected_output: string;
  done_criteria: string;
  created_at: string;
  updated_at: string;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    status: row.status,
    currentPhase: row.current_phase,
    kind: row.kind,
    riskLevel: row.risk_level,
    requiresApproval: row.requires_approval,
    approvalPolicyKey: row.approval_policy_key,
    parentTaskId: row.parent_task_id,
    depth: row.depth,
    creatorAgentId: row.creator_agent_id,
    ownerAgentId: row.owner_agent_id,
    reviewerAgentId: row.reviewer_agent_id,
    assignedByAgentId: row.assigned_by_agent_id,
    requestedByHuman: row.requested_by_human,
    reopenCount: row.reopen_count,
    summary: row.summary,
    inputContext: row.input_context,
    expectedOutput: row.expected_output,
    doneCriteria: row.done_criteria,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TaskRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(task: Task): Promise<void> {
    await this.database.query(
      `INSERT INTO tasks (
        id, company_id, title, description, status, current_phase, kind, risk_level,
        requires_approval, approval_policy_key, parent_task_id, depth, creator_agent_id,
        owner_agent_id, reviewer_agent_id, assigned_by_agent_id, requested_by_human,
        reopen_count, summary, input_context, expected_output, done_criteria, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20::jsonb, $21, $22, $23, $24
      )`,
      [
        task.id,
        task.companyId,
        task.title,
        task.description,
        task.status,
        task.currentPhase,
        task.kind,
        task.riskLevel,
        task.requiresApproval,
        task.approvalPolicyKey,
        task.parentTaskId,
        task.depth,
        task.creatorAgentId,
        task.ownerAgentId,
        task.reviewerAgentId,
        task.assignedByAgentId,
        task.requestedByHuman,
        task.reopenCount,
        task.summary,
        JSON.stringify(task.inputContext),
        task.expectedOutput,
        task.doneCriteria,
        task.createdAt,
        task.updatedAt,
      ],
    );
  }

  public async addDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await this.database.query(
      `INSERT INTO task_dependencies (task_id, depends_on_task_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [taskId, dependsOnTaskId],
    );
  }

  public async createArtifact(input: {
    id: string;
    companyId: string;
    taskId: string;
    artifactType: string;
    title: string;
    uriOrInline: string;
    producedByAgentId: string;
    createdAt: string;
  }): Promise<void> {
    await this.database.query(
      `INSERT INTO task_artifacts (
        id, company_id, task_id, artifact_type, title, uri_or_inline, produced_by_agent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.id,
        input.companyId,
        input.taskId,
        input.artifactType,
        input.title,
        input.uriOrInline,
        input.producedByAgentId,
        input.createdAt,
      ],
    );
  }

  public async updateStatusAndPhase(taskId: string, status: TaskStatus, phase: TaskPhase, summary?: string): Promise<void> {
    await this.database.query(
      `UPDATE tasks
       SET status = $2,
           current_phase = $3,
           summary = COALESCE($4, summary),
           updated_at = NOW()
       WHERE id = $1`,
      [taskId, status, phase, summary ?? null],
    );
  }

  public async incrementReopen(taskId: string): Promise<number> {
    const result = await this.database.query<{ reopen_count: number }>(
      `UPDATE tasks
       SET reopen_count = reopen_count + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING reopen_count`,
      [taskId],
    );

    return result.rows[0]?.reopen_count ?? 0;
  }

  public async getById(taskId: string): Promise<Task | null> {
    const result = await this.database.query<TaskRow>(
      `SELECT id, company_id, title, description, status, current_phase, kind, risk_level,
              requires_approval, approval_policy_key, parent_task_id, depth, creator_agent_id,
              owner_agent_id, reviewer_agent_id, assigned_by_agent_id, requested_by_human,
              reopen_count, summary, input_context, expected_output, done_criteria, created_at, updated_at
       FROM tasks
       WHERE id = $1`,
      [taskId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapTask(result.rows[0]);
  }

  public async listByCompany(companyId: string): Promise<Task[]> {
    const result = await this.database.query<TaskRow>(
      `SELECT id, company_id, title, description, status, current_phase, kind, risk_level,
              requires_approval, approval_policy_key, parent_task_id, depth, creator_agent_id,
              owner_agent_id, reviewer_agent_id, assigned_by_agent_id, requested_by_human,
              reopen_count, summary, input_context, expected_output, done_criteria, created_at, updated_at
       FROM tasks
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId],
    );

    return result.rows.map(mapTask);
  }

  public async countByRunAndOwner(runId: string, ownerAgentId: string): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM tasks t
       JOIN messages m ON m.task_id = t.id
       WHERE m.run_id = $1
       AND t.owner_agent_id = $2`,
      [runId, ownerAgentId],
    );

    return Number(result.rows[0]?.count ?? '0');
  }

  public async listArtifactsByTask(taskId: string): Promise<Array<{
    id: string;
    artifactType: string;
    title: string;
    uriOrInline: string;
    producedByAgentId: string;
    createdAt: string;
  }>> {
    const result = await this.database.query<{
      id: string;
      artifact_type: string;
      title: string;
      uri_or_inline: string;
      produced_by_agent_id: string;
      created_at: string;
    }>(
      `SELECT id, artifact_type, title, uri_or_inline, produced_by_agent_id, created_at
       FROM task_artifacts
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [taskId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      artifactType: row.artifact_type,
      title: row.title,
      uriOrInline: row.uri_or_inline,
      producedByAgentId: row.produced_by_agent_id,
      createdAt: row.created_at,
    }));
  }
}