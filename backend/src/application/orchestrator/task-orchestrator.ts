import type { Agent, Approval, Task } from '~/domain/models.js';
import type { PolicyEngine } from '~/application/policy/policy-engine.js';
import type { LlmGateway } from '~/application/services/llm-gateway.js';
import type { RuntimeAdapter } from '~/infrastructure/runtime/runtime-adapter.js';
import type { TaskRepository } from '~/infrastructure/repositories/task-repository.js';
import type { ApprovalRepository } from '~/infrastructure/repositories/approval-repository.js';
import type { EventBus } from '~/application/services/event-bus.js';
import type { OrchestrationRunRepository } from '~/infrastructure/repositories/orchestration-run-repository.js';
import { createDomainEvent } from '~/application/services/event-factory.js';
import { createId, nowIso } from '~/application/services/utils.js';
import { TaskArtifactSchema } from '~/domain/schemas.js';

interface OrchestrateTaskInput {
  companyId: string;
  runId: string;
  traceId: string;
  rootTask: Task;
  agents: Agent[];
  causedByType: 'human' | 'agent' | 'system';
  causedById: string;
}

interface OrchestrateTaskOutput {
  createdSubtaskIds: string[];
  requiresApproval: boolean;
}

export class TaskOrchestrator {
  public constructor(
    private readonly policyEngine: PolicyEngine,
    private readonly llmGateway: LlmGateway,
    private readonly runtimeAdapter: RuntimeAdapter,
    private readonly taskRepository: TaskRepository,
    private readonly approvalRepository: ApprovalRepository,
    private readonly eventBus: EventBus,
    private readonly runRepository: OrchestrationRunRepository,
  ) {}

  public async orchestrateTask(input: OrchestrateTaskInput): Promise<OrchestrateTaskOutput> {
    const generatedSubtasks = await this.llmGateway.generateSubtasks(input.rootTask, input.agents);
    const createSubtasksDecision = this.policyEngine.canCreateSubtasks(input.rootTask.depth, generatedSubtasks.length);

    if (!createSubtasksDecision.allowed) {
      await this.emitWarning(input, createSubtasksDecision.reason);
      return { createdSubtaskIds: [], requiresApproval: false };
    }

    const cappedSubtasks = generatedSubtasks.slice(0, this.policyEngine.getLimits().maxSubtasksPerDecomposition);
    const createdSubtaskIds: string[] = [];

    for (const subtask of cappedSubtasks) {
      const owner = input.agents.find((agent) => agent.role === subtask.role) ?? null;
      const reviewer = input.agents.find((agent) => agent.role === 'tl') ?? null;
      const taskId = createId();
      const timestamp = nowIso();

      const createdTask: Task = {
        id: taskId,
        companyId: input.companyId,
        title: subtask.title,
        description: subtask.description,
        status: 'todo',
        currentPhase: 'planning',
        kind: 'implementation',
        riskLevel: input.rootTask.riskLevel,
        requiresApproval: false,
        approvalPolicyKey: null,
        parentTaskId: input.rootTask.id,
        depth: input.rootTask.depth + 1,
        creatorAgentId: input.rootTask.ownerAgentId,
        ownerAgentId: owner?.id ?? null,
        reviewerAgentId: reviewer?.id ?? null,
        assignedByAgentId: input.rootTask.ownerAgentId,
        requestedByHuman: false,
        reopenCount: 0,
        summary: null,
        inputContext: {
          parent_task_id: input.rootTask.id,
          decomposition_run_id: input.runId,
        },
        expectedOutput: 'Deliver implementation artifact with concise summary.',
        doneCriteria: 'Task moved to review with artifacts attached.',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await this.taskRepository.create(createdTask);
      await this.taskRepository.addDependency(taskId, input.rootTask.id);
      createdSubtaskIds.push(taskId);

      await this.publishEvent(input, {
        eventType: 'task.created',
        entityType: 'task',
        entityId: createdTask.id,
        payload: {
          title: createdTask.title,
          parent_task_id: createdTask.parentTaskId,
          owner_agent_id: createdTask.ownerAgentId,
        },
      });

      await this.publishEvent(input, {
        eventType: 'task.assigned',
        entityType: 'task',
        entityId: createdTask.id,
        payload: {
          owner_agent_id: createdTask.ownerAgentId,
          reviewer_agent_id: createdTask.reviewerAgentId,
        },
      });

      const riskDecision = this.policyEngine.evaluateRiskyAction(createdTask);
      if (riskDecision.approvalRequired && owner) {
        const approvalCount = await this.approvalRepository.countByTask(createdTask.id);
        const approvalAllowance = this.policyEngine.canRequestApproval(approvalCount);

        if (!approvalAllowance.allowed) {
          await this.emitWarning(input, approvalAllowance.reason);
          continue;
        }

        const approval: Approval = {
          id: createId(),
          companyId: input.companyId,
          runId: input.runId,
          taskId: createdTask.id,
          approvalType: riskDecision.approvalType,
          targetType: 'task',
          targetId: createdTask.id,
          requestedByAgentId: owner.id,
          urgency: createdTask.riskLevel === 'critical' ? 'critical' : 'high',
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          decisionBy: null,
          decisionReason: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        await this.approvalRepository.create(approval);
        await this.taskRepository.updateStatusAndPhase(createdTask.id, 'blocked', 'approval');

        await this.publishEvent(input, {
          eventType: 'approval.required',
          entityType: 'approval',
          entityId: approval.id,
          payload: {
            task_id: createdTask.id,
            approval_type: approval.approvalType,
            expires_at: approval.expiresAt,
          },
        });

        await this.publishEvent(input, {
          eventType: 'task.blocked',
          entityType: 'task',
          entityId: createdTask.id,
          payload: {
            reason: 'approval_required',
          },
        });

        await this.publishEvent(input, {
          eventType: 'task.phase_changed',
          entityType: 'task',
          entityId: createdTask.id,
          payload: {
            from: 'planning',
            to: 'approval',
          },
        });

        continue;
      }

      if (!owner) {
        await this.emitWarning(input, 'subtask_owner_not_found');
        continue;
      }

      await this.runtimeAdapter.provisionAgentRuntime(owner);
      const executionResult = await this.runtimeAdapter.executeTask({
        agent: owner,
        taskId: createdTask.id,
        runId: input.runId,
        instruction: createdTask.description,
      });

      if (!executionResult.success) {
        await this.publishEvent(input, {
          eventType: 'runtime.execution_failed',
          entityType: 'task',
          entityId: createdTask.id,
          payload: {
            agent_id: owner.id,
            reason: 'runtime_execute_failed',
          },
        });

        await this.taskRepository.updateStatusAndPhase(createdTask.id, 'blocked', 'blocked');
        continue;
      }

      const artifactId = createId();
      const artifactCreatedAt = nowIso();
      const artifactPayload = TaskArtifactSchema.parse({
        artifact_type: 'runtime_output',
        title: executionResult.artifactTitle,
        uri_or_inline: executionResult.artifactContent,
        produced_by_agent_id: owner.id,
        task_id: createdTask.id,
        created_at: artifactCreatedAt,
      });
      await this.taskRepository.createArtifact({
        id: artifactId,
        companyId: input.companyId,
        taskId: createdTask.id,
        artifactType: artifactPayload.artifact_type,
        title: artifactPayload.title,
        uriOrInline: artifactPayload.uri_or_inline,
        producedByAgentId: artifactPayload.produced_by_agent_id,
        createdAt: artifactPayload.created_at,
      });

      await this.publishEvent(input, {
        eventType: 'runtime.artifact_collected',
        entityType: 'artifact',
        entityId: artifactId,
        payload: {
          task_id: createdTask.id,
          produced_by_agent_id: owner.id,
        },
      });

      await this.taskRepository.updateStatusAndPhase(createdTask.id, 'review', 'review');

      await this.publishEvent(input, {
        eventType: 'task.status_changed',
        entityType: 'task',
        entityId: createdTask.id,
        payload: {
          from: 'todo',
          to: 'review',
        },
      });

      await this.publishEvent(input, {
        eventType: 'task.phase_changed',
        entityType: 'task',
        entityId: createdTask.id,
        payload: {
          from: 'planning',
          to: 'review',
        },
      });

      await this.publishEvent(input, {
        eventType: 'task.review_requested',
        entityType: 'task',
        entityId: createdTask.id,
        payload: {
          reviewer_agent_id: createdTask.reviewerAgentId,
        },
      });

      await this.runtimeAdapter.teardownAgentRuntime(owner.id);
      await this.advanceRunStepWithPolicy(input);
    }

    await this.publishEvent(input, {
      eventType: 'task.decomposed',
      entityType: 'task',
      entityId: input.rootTask.id,
      payload: {
        subtask_ids: createdSubtaskIds,
      },
    });

    return {
      createdSubtaskIds,
      requiresApproval: false,
    };
  }

  private async advanceRunStepWithPolicy(input: OrchestrateTaskInput): Promise<void> {
    const stepCount = await this.runRepository.incrementStep(input.runId);
    const stepDecision = this.policyEngine.canAdvanceRunStep(stepCount);
    if (!stepDecision.allowed) {
      await this.emitWarning(input, stepDecision.reason);
      await this.runRepository.finalize(input.runId, 'finished', 'warning_only', stepDecision.reason);
    }
  }

  private async emitWarning(input: OrchestrateTaskInput, reason: string): Promise<void> {
    await this.publishEvent(input, {
      eventType: 'orchestrator.warning',
      entityType: 'run',
      entityId: input.runId,
      payload: {
        reason,
      },
    });
  }

  private async publishEvent(
    input: OrchestrateTaskInput,
    event: {
      eventType: 'task.created' | 'task.decomposed' | 'task.assigned' | 'task.status_changed' | 'task.phase_changed' | 'task.review_requested' | 'task.blocked' | 'approval.required' | 'runtime.artifact_collected' | 'runtime.execution_failed' | 'orchestrator.warning';
      entityType: string;
      entityId: string;
      payload: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.eventBus.publish(
      createDomainEvent({
        eventType: event.eventType,
        companyId: input.companyId,
        runId: input.runId,
        traceId: input.traceId,
        entityType: event.entityType,
        entityId: event.entityId,
        causedByType: input.causedByType,
        causedById: input.causedById,
        payload: event.payload,
      }),
    );
  }
}
