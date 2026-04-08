import type { Approval, OrchestrationRun } from '../../../types/domain';
import { formatDateTime, formatRunOutcome } from '../control-center-utils';

interface RunsScreenProps {
  activeRuns: OrchestrationRun[];
  pendingApprovals: Approval[];
}

export function RunsScreen({ activeRuns, pendingApprovals }: RunsScreenProps): JSX.Element {
  return (
    <section className="control-pane">
      <h4>Runs and Approvals</h4>
      <p className="pane-subtitle">Observe orchestration lifecycle and pending decisions.</p>

      <div className="control-dual-grid">
        <article className="control-card">
          <h5>Recent Runs</h5>
          <ul className="dashboard-list">
            {activeRuns.length === 0 ? <li>No runs yet.</li> : null}
            {activeRuns.map((run) => (
              <li key={run.runId}>
                <p>{run.runId}</p>
                <small>{formatRunOutcome(run)}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="control-card">
          <h5>Pending Approvals</h5>
          <ul className="dashboard-list">
            {pendingApprovals.length === 0 ? <li>No pending approvals.</li> : null}
            {pendingApprovals.map((approval) => (
              <li key={approval.id}>
                <p>{approval.taskId}</p>
                <small>
                  {approval.urgency} · {formatDateTime(approval.expiresAt)}
                </small>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

