import type { AgentRepository } from '~/infrastructure/repositories/agent-repository.js';
import type { CompanyRepository } from '~/infrastructure/repositories/company-repository.js';
import type { EventBus } from '~/application/services/event-bus.js';
import type { UpdateAgentInput } from '~/domain/schemas.js';
import type { Agent } from '~/domain/models.js';
import { DomainError } from '~/domain/errors.js';
import { createDomainEvent } from '~/application/services/event-factory.js';
import { createId } from '~/application/services/utils.js';

const EDITABLE_FIELDS = [
  'role',
  'name',
  'manager_agent_id',
  'status',
  'model_profile',
  'runtime_kind',
  'delegation_limit',
  'specialization_hint',
  'responsibilities',
  'tool_policy',
] as const;

function hasAtLeastOneField(input: UpdateAgentInput): boolean {
  return EDITABLE_FIELDS.some((field) => field in input);
}

function isEqualValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right) || typeof left === 'object' || typeof right === 'object') {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  return left === right;
}

export class UpdateAgentUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly agentRepository: AgentRepository,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(agentId: string, input: UpdateAgentInput): Promise<{ agentId: string }> {
    if (!hasAtLeastOneField(input)) {
      throw new DomainError('VALIDATION_FAILED', 'Agent update payload is empty.');
    }

    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    const existingAgent = await this.agentRepository.getById(agentId);
    if (!existingAgent || existingAgent.companyId !== company.id) {
      throw new DomainError('NOT_FOUND', 'Agent not found.');
    }

    if (input.manager_agent_id !== undefined) {
      if (input.manager_agent_id === existingAgent.id) {
        throw new DomainError('VALIDATION_FAILED', 'Agent cannot be own manager.');
      }

      if (input.manager_agent_id !== null) {
        const manager = await this.agentRepository.getById(input.manager_agent_id);
        if (!manager || manager.companyId !== company.id) {
          throw new DomainError('VALIDATION_FAILED', 'Manager agent not found.');
        }
      }
    }

    const updatedAgent: Agent = {
      ...existingAgent,
      role: input.role ?? existingAgent.role,
      name: input.name ?? existingAgent.name,
      managerAgentId: input.manager_agent_id ?? existingAgent.managerAgentId,
      status: input.status ?? existingAgent.status,
      modelProfile: input.model_profile ?? existingAgent.modelProfile,
      runtimeKind: input.runtime_kind ?? existingAgent.runtimeKind,
      delegationLimit: input.delegation_limit ?? existingAgent.delegationLimit,
      specializationHint: input.specialization_hint ?? existingAgent.specializationHint,
      responsibilities: input.responsibilities ?? existingAgent.responsibilities,
      toolPolicy: input.tool_policy ?? existingAgent.toolPolicy,
    };

    const changedFields = EDITABLE_FIELDS.filter((field) => {
      switch (field) {
        case 'role':
          return !isEqualValue(existingAgent.role, updatedAgent.role);
        case 'name':
          return !isEqualValue(existingAgent.name, updatedAgent.name);
        case 'manager_agent_id':
          return !isEqualValue(existingAgent.managerAgentId, updatedAgent.managerAgentId);
        case 'status':
          return !isEqualValue(existingAgent.status, updatedAgent.status);
        case 'model_profile':
          return !isEqualValue(existingAgent.modelProfile, updatedAgent.modelProfile);
        case 'runtime_kind':
          return !isEqualValue(existingAgent.runtimeKind, updatedAgent.runtimeKind);
        case 'delegation_limit':
          return !isEqualValue(existingAgent.delegationLimit, updatedAgent.delegationLimit);
        case 'specialization_hint':
          return !isEqualValue(existingAgent.specializationHint, updatedAgent.specializationHint);
        case 'responsibilities':
          return !isEqualValue(existingAgent.responsibilities, updatedAgent.responsibilities);
        case 'tool_policy':
          return !isEqualValue(existingAgent.toolPolicy, updatedAgent.toolPolicy);
        default:
          return false;
      }
    });

    await this.agentRepository.update(updatedAgent);

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'agent.updated',
        companyId: company.id,
        runId: createId(),
        traceId: createId(),
        entityType: 'agent',
        entityId: updatedAgent.id,
        causedByType: 'human',
        causedById: 'founder',
        payload: {
          changed_fields: changedFields,
          role: updatedAgent.role,
          status: updatedAgent.status,
          manager_agent_id: updatedAgent.managerAgentId,
          runtime_kind: updatedAgent.runtimeKind,
          delegation_limit: updatedAgent.delegationLimit,
        },
      }),
    );

    return {
      agentId: updatedAgent.id,
    };
  }
}
