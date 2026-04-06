import type { OrchestrationRun } from '../../domain/models.js';
import type { RunOutcome, RunStatus } from '../../domain/enums.js';
import type { DatabaseClient } from '../db/pool.js';

interface RunRow {
  run_id: string;
  company_id: string;
  status: RunStatus;
  outcome: RunOutcome | null;
  trigger_type: OrchestrationRun['triggerType'];
  trigger_ref: string | null;
  step_count: number;
  warning_reason: string | null;
  started_at: string;
  finished_at: string | null;
}

function mapRun(row: RunRow): OrchestrationRun {
  return {
    runId: row.run_id,
    companyId: row.company_id,
    status: row.status,
    outcome: row.outcome,
    triggerType: row.trigger_type,
    triggerRef: row.trigger_ref,
    stepCount: row.step_count,
    warningReason: row.warning_reason,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export class OrchestrationRunRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(run: OrchestrationRun): Promise<void> {
    await this.database.query(
      `INSERT INTO orchestration_runs (
        run_id, company_id, status, outcome, trigger_type, trigger_ref,
        step_count, warning_reason, started_at, finished_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        run.runId,
        run.companyId,
        run.status,
        run.outcome,
        run.triggerType,
        run.triggerRef,
        run.stepCount,
        run.warningReason,
        run.startedAt,
        run.finishedAt,
      ],
    );
  }

  public async incrementStep(runId: string): Promise<number> {
    const result = await this.database.query<{ step_count: number }>(
      `UPDATE orchestration_runs
       SET step_count = step_count + 1
       WHERE run_id = $1
       RETURNING step_count`,
      [runId],
    );

    return result.rows[0]?.step_count ?? 0;
  }

  public async finalize(runId: string, status: RunStatus, outcome: RunOutcome, warningReason: string | null): Promise<void> {
    await this.database.query(
      `UPDATE orchestration_runs
       SET status = $2, outcome = $3, warning_reason = $4, finished_at = NOW()
       WHERE run_id = $1`,
      [runId, status, outcome, warningReason],
    );
  }

  public async getById(runId: string): Promise<OrchestrationRun | null> {
    const result = await this.database.query<RunRow>(
      `SELECT run_id, company_id, status, outcome, trigger_type, trigger_ref,
              step_count, warning_reason, started_at, finished_at
       FROM orchestration_runs
       WHERE run_id = $1`,
      [runId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRun(result.rows[0]);
  }

  public async listByCompany(companyId: string): Promise<OrchestrationRun[]> {
    const result = await this.database.query<RunRow>(
      `SELECT run_id, company_id, status, outcome, trigger_type, trigger_ref,
              step_count, warning_reason, started_at, finished_at
       FROM orchestration_runs
       WHERE company_id = $1
       ORDER BY started_at DESC`,
      [companyId],
    );

    return result.rows.map(mapRun);
  }
}