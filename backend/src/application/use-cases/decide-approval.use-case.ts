import type { DecideApprovalInput } from '../../domain/schemas.js';
import type { ApprovalRepository } from '../../infrastructure/repositories/approval-repository.js';
import type { TaskRepository } from '../../infrastructure/repositories/task-repository.js';
import type { CompanyRepository } from '../../infrastructure/repositories/company-repository.js';
import type { EventBus } from '../services/event-bus.js';
import type { OrchestrationRunRepository } from '../../infrastructure/repositories/orchestration-run-repository.js';
import { DomainError } from '../../domain/errors.js';
import { createDomainEvent } from '../services/event-factory.js';
import { createId } from '../services/utils.js';

export class DecideApprovalUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly approvalRepository: ApprovalRepository,
    private readonly taskRepository: TaskRepository,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(approvalId: string, input: DecideApprovalInput): Promise<{ runId: string; approvalId: string }> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    const approval = await this.approvalRepository.getById(approvalId);
    if (!approval || approval.companyId !== company.id) {
      throw new DomainError('NOT_FOUND', 'Approval not found.');
    }

    if (approval.status !== 'pending') {
      throw new DomainError('CONFLICT', 'Approval already resolved.', { status: approval.status });
    }

    const task = await this.taskRepository.getById(approval.taskId);
    if (!task) {
      throw new DomainError('NOT_FOUND', 'Task for approval not found.');
    }

    const runId = createId();
    const traceId = createId();
    await this.runRepository.create({
      runId,
      companyId: company.id,
      status: 'running',
      outcome: null,
      triggerType: 'approval_decision',
      triggerRef: approval.id,
      stepCount: 0,
      warningReason: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    });

    await this.approvalRepository.updateDecision({
      id: approvalId,
      status: input.decision,
      decisionBy: input.decision_by,
      decisionReason: input.decision_reason,
    });

    if (input.decision === 'approved') {
      await this.taskRepository.updateStatusAndPhase(task.id, 'review', 'review');
    } else {
      await this.taskRepository.updateStatusAndPhase(task.id, 'blocked', 'blocked');
    }

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'approval.resolved',
        companyId: company.id,
        runId,
        traceId,
        entityType: 'approval',
        entityId: approval.id,
        causedByType: 'human',
        causedById: input.decision_by,
        payload: {
          decision: input.decision,
          decision_reason: input.decision_reason,
          task_id: approval.taskId,
        },
      }),
    );

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'task.phase_changed',
        companyId: company.id,
        runId,
        traceId,
        entityType: 'task',
        entityId: approval.taskId,
        causedByType: 'human',
        causedById: input.decision_by,
        payload: {
          to: input.decision === 'approved' ? 'review' : 'blocked',
        },
      }),
    );

    await this.runRepository.finalize(runId, 'finished', input.decision === 'approved' ? 'completed' : 'stopped_by_human', null);

    return {
      runId,
      approvalId,
    };
  }
}