import type { CompanyRepository } from '../../infrastructure/repositories/company-repository.js';
import type { AgentRepository } from '../../infrastructure/repositories/agent-repository.js';
import type { TaskRepository } from '../../infrastructure/repositories/task-repository.js';
import type { ApprovalRepository } from '../../infrastructure/repositories/approval-repository.js';
import type { EventLogRepository } from '../../infrastructure/repositories/event-log-repository.js';
import type { OrchestrationRunRepository } from '../../infrastructure/repositories/orchestration-run-repository.js';
import { DomainError } from '../../domain/errors.js';

export class QueryCollectionsUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly agentRepository: AgentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly approvalRepository: ApprovalRepository,
    private readonly eventLogRepository: EventLogRepository,
    private readonly runRepository: OrchestrationRunRepository,
  ) {}

  public async listAgents(): Promise<unknown[]> {
    const company = await this.requireCompany();
    return this.agentRepository.listByCompany(company.id);
  }

  public async listTasks(): Promise<unknown[]> {
    const company = await this.requireCompany();
    return this.taskRepository.listByCompany(company.id);
  }

  public async listApprovals(): Promise<unknown[]> {
    const company = await this.requireCompany();
    return this.approvalRepository.listByCompany(company.id);
  }

  public async listEvents(): Promise<unknown[]> {
    const company = await this.requireCompany();
    return this.eventLogRepository.listByCompany(company.id, 300);
  }

  public async listRuns(): Promise<unknown[]> {
    const company = await this.requireCompany();
    return this.runRepository.listByCompany(company.id);
  }

  public async getRunById(runId: string): Promise<unknown> {
    await this.requireCompany();
    const run = await this.runRepository.getById(runId);
    if (!run) {
      throw new DomainError('NOT_FOUND', 'Run not found.');
    }

    return run;
  }

  private async requireCompany(): Promise<{ id: string }> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    return company;
  }
}