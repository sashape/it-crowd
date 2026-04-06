import type { CreateTaskInput } from '../../domain/schemas.js';
import type { Agent, OrchestrationRun, Task } from '../../domain/models.js';
import type { CompanyRepository } from '../../infrastructure/repositories/company-repository.js';
import type { AgentRepository } from '../../infrastructure/repositories/agent-repository.js';
import type { OrchestrationRunRepository } from '../../infrastructure/repositories/orchestration-run-repository.js';
import type { TaskRepository } from '../../infrastructure/repositories/task-repository.js';
import type { EventBus } from '../services/event-bus.js';
import type { TaskOrchestrator } from '../orchestrator/task-orchestrator.js';
import { DomainError } from '../../domain/errors.js';
import { createDomainEvent } from '../services/event-factory.js';
import { createId, nowIso } from '../services/utils.js';

export class CreateTaskUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly agentRepository: AgentRepository,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly taskRepository: TaskRepository,
    private readonly orchestrator: TaskOrchestrator,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(input: CreateTaskInput): Promise<{ taskId: string; runId: string; subtaskIds: string[] }> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    const agents = await this.agentRepository.listByCompany(company.id);
    const tlAgent = this.requireAgent(agents, 'tl');
    const pmAgent = this.requireAgent(agents, 'pm');
    const qaAgent = this.requireAgent(agents, 'qa');

    const runId = createId();
    const traceId = createId();
    const timestamp = nowIso();

    const run: OrchestrationRun = {
      runId,
      companyId: company.id,
      status: 'running',
      outcome: null,
      triggerType: 'human_instruction',
      triggerRef: input.requested_by,
      stepCount: 0,
      warningReason: null,
      startedAt: timestamp,
      finishedAt: null,
    };

    await this.runRepository.create(run);

    const task: Task = {
      id: createId(),
      companyId: company.id,
      title: input.title,
      description: input.description,
      status: 'todo',
      currentPhase: 'intake',
      kind: input.kind,
      riskLevel: input.risk_level,
      requiresApproval: false,
      approvalPolicyKey: null,
      parentTaskId: null,
      depth: 0,
      creatorAgentId: pmAgent.id,
      ownerAgentId: tlAgent.id,
      reviewerAgentId: qaAgent.id,
      assignedByAgentId: pmAgent.id,
      requestedByHuman: true,
      reopenCount: 0,
      summary: null,
      inputContext: {
        requested_by: input.requested_by,
        priority: input.priority,
      },
      expectedOutput: 'Completed work package with linked artifacts.',
      doneCriteria: 'All subtasks reviewed and accepted.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.taskRepository.create(task);

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'task.created',
        companyId: company.id,
        runId,
        traceId,
        entityType: 'task',
        entityId: task.id,
        causedByType: 'human',
        causedById: input.requested_by,
        payload: {
          title: task.title,
          risk_level: task.riskLevel,
          requested_by_human: true,
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
        entityId: task.id,
        causedByType: 'human',
        causedById: input.requested_by,
        payload: {
          from: 'intake',
          to: 'planning',
        },
      }),
    );

    await this.taskRepository.updateStatusAndPhase(task.id, 'todo', 'planning');

    const orchestration = await this.orchestrator.orchestrateTask({
      companyId: company.id,
      runId,
      traceId,
      rootTask: {
        ...task,
        currentPhase: 'planning',
      },
      agents,
      causedByType: 'human',
      causedById: input.requested_by,
    });

    await this.runRepository.finalize(runId, 'finished', 'completed', null);

    return {
      taskId: task.id,
      runId,
      subtaskIds: orchestration.createdSubtaskIds,
    };
  }

  private requireAgent(agents: Agent[], role: Agent['role']): Agent {
    const found = agents.find((agent) => agent.role === role);
    if (!found) {
      throw new DomainError('INFRA_FAILURE', `Agent role ${role} is missing.`);
    }

    return found;
  }
}