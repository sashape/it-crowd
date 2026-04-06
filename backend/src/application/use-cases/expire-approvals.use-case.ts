import type { ApprovalRepository } from '../../infrastructure/repositories/approval-repository.js';
import type { TaskRepository } from '../../infrastructure/repositories/task-repository.js';
import type { EventBus } from '../services/event-bus.js';
import { createDomainEvent } from '../services/event-factory.js';

export class ExpireApprovalsUseCase {
  public constructor(
    private readonly approvalRepository: ApprovalRepository,
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(input: { companyId: string; traceId: string }): Promise<number> {
    const pendingExpired = await this.approvalRepository.listExpiredPending(input.companyId, new Date().toISOString());

    for (const approval of pendingExpired) {
      await this.approvalRepository.expire(approval.id);

      const phase = this.approvalRepository.expiryMatrixTargetPhase(approval.approvalType);
      const status = phase === 'blocked' ? 'blocked' : 'review';
      await this.taskRepository.updateStatusAndPhase(approval.taskId, status, phase);

      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'approval.expired',
          companyId: input.companyId,
          runId: approval.runId,
          traceId: input.traceId,
          entityType: 'approval',
          entityId: approval.id,
          causedByType: 'system',
          causedById: 'approval-expirer',
          payload: {
            task_id: approval.taskId,
            approval_type: approval.approvalType,
            expired_at: new Date().toISOString(),
          },
        }),
      );

      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'task.phase_changed',
          companyId: input.companyId,
          runId: approval.runId,
          traceId: input.traceId,
          entityType: 'task',
          entityId: approval.taskId,
          causedByType: 'system',
          causedById: 'approval-expirer',
          payload: {
            to: phase,
          },
        }),
      );

      if (status === 'blocked') {
        await this.eventBus.publish(
          createDomainEvent({
            eventType: 'task.blocked',
            companyId: input.companyId,
            runId: approval.runId,
            traceId: input.traceId,
            entityType: 'task',
            entityId: approval.taskId,
            causedByType: 'system',
            causedById: 'approval-expirer',
            payload: {
              reason: 'approval_expired_external_action',
            },
          }),
        );
      } else {
        await this.eventBus.publish(
          createDomainEvent({
            eventType: 'task.review_requested',
            companyId: input.companyId,
            runId: approval.runId,
            traceId: input.traceId,
            entityType: 'task',
            entityId: approval.taskId,
            causedByType: 'system',
            causedById: 'approval-expirer',
            payload: {
              reason: 'approval_expired_quality',
            },
          }),
        );
      }
    }

    return pendingExpired.length;
  }
}