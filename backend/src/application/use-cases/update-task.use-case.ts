import type { UpdateTaskInput } from '~/domain/schemas.js';
import type { PolicyEngine } from '~/application/policy/policy-engine.js';
import type { TaskRepository } from '~/infrastructure/repositories/task-repository.js';
import type { CompanyRepository } from '~/infrastructure/repositories/company-repository.js';
import type { EventBus } from '~/application/services/event-bus.js';
import type { OrchestrationRunRepository } from '~/infrastructure/repositories/orchestration-run-repository.js';
import { DomainError } from '~/domain/errors.js';
import { createDomainEvent } from '~/application/services/event-factory.js';
import { createId } from '~/application/services/utils.js';

export class UpdateTaskUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly taskRepository: TaskRepository,
    private readonly policyEngine: PolicyEngine,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(taskId: string, input: UpdateTaskInput): Promise<{ runId: string; taskId: string }> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    const task = await this.taskRepository.getById(taskId);
    if (!task || task.companyId !== company.id) {
      throw new DomainError('NOT_FOUND', 'Task not found.');
    }

    const runId = createId();
    const traceId = createId();

    await this.runRepository.create({
      runId,
      companyId: company.id,
      status: 'running',
      outcome: null,
      triggerType: 'task_update',
      triggerRef: taskId,
      stepCount: 0,
      warningReason: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    });

    let nextStatus = task.status;
    let nextPhase = task.currentPhase;

    if (input.status && input.status !== task.status) {
      const decision = this.policyEngine.canTransitionStatus(task.status, input.status);
      if (!decision.allowed) {
        await this.runRepository.finalize(runId, 'finished', 'stopped_by_policy', decision.reason);
        throw new DomainError('POLICY_REJECTED', 'Status transition is not allowed.', {
          reason: decision.reason,
        });
      }

      if (task.status === 'done' && input.status === 'review') {
        const reopenDecision = this.policyEngine.canReopenTask(task.reopenCount);
        if (!reopenDecision.allowed) {
          await this.runRepository.finalize(runId, 'finished', 'stopped_by_policy', reopenDecision.reason);
          throw new DomainError('POLICY_REJECTED', 'Task reopen limit exceeded.', {
            reason: reopenDecision.reason,
          });
        }

        await this.taskRepository.incrementReopen(task.id);
        await this.eventBus.publish(
          createDomainEvent({
            eventType: 'task.reopened',
            companyId: company.id,
            runId,
            traceId,
            entityType: 'task',
            entityId: task.id,
            causedByType: 'human',
            causedById: 'founder',
            payload: {
              reopen_count: task.reopenCount + 1,
            },
          }),
        );
      }

      nextStatus = input.status;
      nextPhase = this.policyEngine.inferPhaseForStatus(nextStatus);

      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'task.status_changed',
          companyId: company.id,
          runId,
          traceId,
          entityType: 'task',
          entityId: task.id,
          causedByType: 'human',
          causedById: 'founder',
          payload: {
            from: task.status,
            to: nextStatus,
          },
        }),
      );
    }

    if (input.current_phase && input.current_phase !== task.currentPhase) {
      nextPhase = input.current_phase;
    }

    if (nextPhase !== task.currentPhase) {
      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'task.phase_changed',
          companyId: company.id,
          runId,
          traceId,
          entityType: 'task',
          entityId: task.id,
          causedByType: 'human',
          causedById: 'founder',
          payload: {
            from: task.currentPhase,
            to: nextPhase,
          },
        }),
      );
    }

    await this.taskRepository.updateStatusAndPhase(task.id, nextStatus, nextPhase, input.summary);

    if (nextStatus === 'review') {
      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'task.review_requested',
          companyId: company.id,
          runId,
          traceId,
          entityType: 'task',
          entityId: task.id,
          causedByType: 'human',
          causedById: 'founder',
          payload: {
            reviewer_agent_id: task.reviewerAgentId,
          },
        }),
      );
    }

    if (nextStatus === 'blocked') {
      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'task.blocked',
          companyId: company.id,
          runId,
          traceId,
          entityType: 'task',
          entityId: task.id,
          causedByType: 'human',
          causedById: 'founder',
          payload: {
            reason: 'manual_block',
          },
        }),
      );
    }

    await this.runRepository.finalize(runId, 'finished', 'completed', null);

    return {
      runId,
      taskId,
    };
  }
}