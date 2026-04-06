import type { BootstrapCompanyInput } from '~/domain/schemas.js';
import type { Company, OrchestrationRun, Task } from '~/domain/models.js';
import type { CompanyRepository } from '~/infrastructure/repositories/company-repository.js';
import type { AgentRepository } from '~/infrastructure/repositories/agent-repository.js';
import type { AgentInstructionRepository } from '~/infrastructure/repositories/agent-instruction-repository.js';
import type { OrchestrationRunRepository } from '~/infrastructure/repositories/orchestration-run-repository.js';
import type { TaskRepository } from '~/infrastructure/repositories/task-repository.js';
import type { EventBus } from '~/application/services/event-bus.js';
import type { CompanyGenerator } from '~/application/services/company-generator.js';
import type { TaskOrchestrator } from '~/application/orchestrator/task-orchestrator.js';
import { createDomainEvent } from '~/application/services/event-factory.js';
import { createId, nowIso } from '~/application/services/utils.js';

export interface BootstrapCompanyResult {
  companyId: string;
  blueprint: {
    departments: string[];
    reportingLines: Array<{ managerRole: string; reportRole: string }>;
    workflows: string[];
  };
  agents: Array<{ id: string; role: string; name: string; manager_agent_id: string | null }>;
  initialTasks: Array<{ id: string; title: string }>;
  runId: string;
}

export class BootstrapCompanyUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly agentRepository: AgentRepository,
    private readonly agentInstructionRepository: AgentInstructionRepository,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus,
    private readonly companyGenerator: CompanyGenerator,
    private readonly taskOrchestrator: TaskOrchestrator,
  ) {}

  public async execute(input: BootstrapCompanyInput): Promise<BootstrapCompanyResult> {
    const companyId = createId();
    const runId = createId();
    const traceId = createId();
    const timestamp = nowIso();

    const company: Company = {
      id: companyId,
      name: input.company_name,
      prompt: input.company_prompt,
      language: input.language,
      blueprintStatus: 'blueprint_draft',
      createdAt: timestamp,
    };

    await this.companyRepository.create(company);

    const run: OrchestrationRun = {
      runId,
      companyId,
      status: 'running',
      outcome: null,
      triggerType: 'bootstrap',
      triggerRef: null,
      stepCount: 0,
      warningReason: null,
      startedAt: timestamp,
      finishedAt: null,
    };

    await this.runRepository.create(run);

    const generated = this.companyGenerator.generate(company);
    await this.agentRepository.createMany(generated.agents);

    const instructionArtifacts: Array<{
      id: string;
      companyId: string;
      agentId: string;
      artifactName: string;
      content: string;
      createdAt: string;
    }> = [];

    for (const agent of generated.agents) {
      instructionArtifacts.push(
        {
          id: createId(),
          companyId,
          agentId: agent.id,
          artifactName: 'role.md',
          content: `Role: ${agent.role}\nResponsibilities:\n- ${agent.responsibilities.join('\n- ')}`,
          createdAt: timestamp,
        },
        {
          id: createId(),
          companyId,
          agentId: agent.id,
          artifactName: 'operating_rules.md',
          content:
            'Do not violate policy limits. Use structured handoff payload for delegated work. Escalate risky actions.',
          createdAt: timestamp,
        },
        {
          id: createId(),
          companyId,
          agentId: agent.id,
          artifactName: 'handoff_contract.md',
          content:
            'Required fields: goal, context, expected_output, constraints, acceptance_criteria, deadline.',
          createdAt: timestamp,
        },
      );
    }

    await this.agentInstructionRepository.createMany(instructionArtifacts);

    for (const agent of generated.agents) {
      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'agent.created',
          companyId,
          runId,
          traceId,
          entityType: 'agent',
          entityId: agent.id,
          causedByType: 'system',
          causedById: 'bootstrap',
          payload: {
            role: agent.role,
            name: agent.name,
            manager_agent_id: agent.managerAgentId,
            specialization_hint: agent.specializationHint,
          },
        }),
      );
    }

    const pmAgent = generated.agents.find((agent) => agent.role === 'pm');
    const tlAgent = generated.agents.find((agent) => agent.role === 'tl');
    const qaAgent = generated.agents.find((agent) => agent.role === 'qa');

    const rootTask: Task = {
      id: createId(),
      companyId,
      title: `Bootstrap delivery loop for ${company.name}`,
      description: `Create an initial delivery baseline for: ${company.prompt}`,
      status: 'todo',
      currentPhase: 'intake',
      kind: 'analysis',
      riskLevel: 'medium',
      requiresApproval: false,
      approvalPolicyKey: null,
      parentTaskId: null,
      depth: 0,
      creatorAgentId: pmAgent?.id ?? null,
      ownerAgentId: tlAgent?.id ?? null,
      reviewerAgentId: qaAgent?.id ?? null,
      assignedByAgentId: pmAgent?.id ?? null,
      requestedByHuman: false,
      reopenCount: 0,
      summary: null,
      inputContext: {
        bootstrap: true,
      },
      expectedOutput: 'Initial delivery structure prepared.',
      doneCriteria: 'Subtasks are generated and routed.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.taskRepository.create(rootTask);

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'task.created',
        companyId,
        runId,
        traceId,
        entityType: 'task',
        entityId: rootTask.id,
        causedByType: 'system',
        causedById: 'bootstrap',
        payload: {
          title: rootTask.title,
          phase: rootTask.currentPhase,
        },
      }),
    );

    const orchestrationResult = await this.taskOrchestrator.orchestrateTask({
      companyId,
      runId,
      traceId,
      rootTask,
      agents: generated.agents,
      causedByType: 'system',
      causedById: 'bootstrap',
    });

    await this.companyRepository.updateBlueprintStatus(companyId, 'blueprint_confirmed');

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'company.bootstrapped',
        companyId,
        runId,
        traceId,
        entityType: 'company',
        entityId: companyId,
        causedByType: 'system',
        causedById: 'bootstrap',
        payload: {
          blueprint_status: 'blueprint_confirmed',
          initial_task_count: orchestrationResult.createdSubtaskIds.length + 1,
        },
      }),
    );

    await this.runRepository.finalize(runId, 'finished', 'completed', null);

    return {
      companyId,
      blueprint: generated.blueprint,
      agents: generated.agents.map((agent) => ({
        id: agent.id,
        role: agent.role,
        name: agent.name,
        manager_agent_id: agent.managerAgentId,
      })),
      initialTasks: [{ id: rootTask.id, title: rootTask.title }],
      runId,
    };
  }
}