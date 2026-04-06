import type { CompanyRepository } from '~/infrastructure/repositories/company-repository.js';
import type { AgentRepository } from '~/infrastructure/repositories/agent-repository.js';
import type { TaskRepository } from '~/infrastructure/repositories/task-repository.js';
import type { ApprovalRepository } from '~/infrastructure/repositories/approval-repository.js';
import type { EventLogRepository } from '~/infrastructure/repositories/event-log-repository.js';
import type { OrchestrationRunRepository } from '~/infrastructure/repositories/orchestration-run-repository.js';
import type { ExpireApprovalsUseCase } from '~/application/use-cases/expire-approvals.use-case.js';
import { DomainError } from '~/domain/errors.js';

export class GetCompanyStateUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly agentRepository: AgentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly approvalRepository: ApprovalRepository,
    private readonly eventLogRepository: EventLogRepository,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly expireApprovalsUseCase: ExpireApprovalsUseCase,
  ) {}

  public async execute(include: Set<string>): Promise<Record<string, unknown>> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    await this.expireApprovalsUseCase.execute({ companyId: company.id, traceId: 'state-refresh' });

    const response: Record<string, unknown> = {
      company,
    };

    if (include.has('agents')) {
      response.agents = await this.agentRepository.listByCompany(company.id);
    }

    if (include.has('tasks')) {
      response.tasks = await this.taskRepository.listByCompany(company.id);
    }

    if (include.has('approvals')) {
      response.approvals = await this.approvalRepository.listByCompany(company.id);
    }

    if (include.has('recent_events')) {
      response.recent_events = await this.eventLogRepository.listByCompany(company.id, 200);
    }

    if (include.has('runs')) {
      const runs = await this.runRepository.listByCompany(company.id);
      response.runs = runs;
      response.active_run_id = runs.find((run) => run.status === 'running')?.runId ?? null;
      response.recent_run_ids = runs.slice(0, 10).map((run) => run.runId);
    }

    return response;
  }
}