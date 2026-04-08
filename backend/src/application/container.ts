import type { DatabaseClient } from '~/infrastructure/db/pool.js';
import { db } from '~/infrastructure/db/pool.js';
import { CompanyRepository } from '~/infrastructure/repositories/company-repository.js';
import { AgentRepository } from '~/infrastructure/repositories/agent-repository.js';
import { AgentInstructionRepository } from '~/infrastructure/repositories/agent-instruction-repository.js';
import { OrchestrationRunRepository } from '~/infrastructure/repositories/orchestration-run-repository.js';
import { TaskRepository } from '~/infrastructure/repositories/task-repository.js';
import { ApprovalRepository } from '~/infrastructure/repositories/approval-repository.js';
import { MessageRepository } from '~/infrastructure/repositories/message-repository.js';
import { EventLogRepository } from '~/infrastructure/repositories/event-log-repository.js';
import { IdempotencyRepository } from '~/infrastructure/repositories/idempotency-repository.js';
import { MockRuntimeAdapter } from '~/infrastructure/runtime/runtime-adapter.js';
import { appConfig } from '~/application/services/config.js';
import { EventBus } from '~/application/services/event-bus.js';
import { CompanyGenerator } from '~/application/services/company-generator.js';
import { LlmGateway } from '~/application/services/llm-gateway.js';
import { IdempotencyService } from '~/application/services/idempotency-service.js';
import { PolicyEngine } from '~/application/policy/policy-engine.js';
import { TaskOrchestrator } from '~/application/orchestrator/task-orchestrator.js';
import { BootstrapCompanyUseCase } from '~/application/use-cases/bootstrap-company.use-case.js';
import { CreateTaskUseCase } from '~/application/use-cases/create-task.use-case.js';
import { UpdateTaskUseCase } from '~/application/use-cases/update-task.use-case.js';
import { PostMessageUseCase } from '~/application/use-cases/post-message.use-case.js';
import { DecideApprovalUseCase } from '~/application/use-cases/decide-approval.use-case.js';
import { ExpireApprovalsUseCase } from '~/application/use-cases/expire-approvals.use-case.js';
import { GetCompanyStateUseCase } from '~/application/use-cases/get-company-state.use-case.js';
import { QueryCollectionsUseCase } from '~/application/use-cases/query-collections.use-case.js';

interface ContainerOptions {
  database?: DatabaseClient;
  llmMode?: typeof appConfig.LLM_MODE;
  llmProvider?: typeof appConfig.LLM_PROVIDER;
  openAiApiKey?: string;
  anthropicApiKey?: string;
}

export function createAppContainer(options: ContainerOptions = {}): {
  eventBus: EventBus;
  policyEngine: PolicyEngine;
  idempotencyService: IdempotencyService;
  bootstrapCompanyUseCase: BootstrapCompanyUseCase;
  createTaskUseCase: CreateTaskUseCase;
  updateTaskUseCase: UpdateTaskUseCase;
  postMessageUseCase: PostMessageUseCase;
  decideApprovalUseCase: DecideApprovalUseCase;
  expireApprovalsUseCase: ExpireApprovalsUseCase;
  getCompanyStateUseCase: GetCompanyStateUseCase;
  queryCollectionsUseCase: QueryCollectionsUseCase;
} {
  const database = options.database ?? db;

  const companyRepository = new CompanyRepository(database);
  const agentRepository = new AgentRepository(database);
  const agentInstructionRepository = new AgentInstructionRepository(database);
  const runRepository = new OrchestrationRunRepository(database);
  const taskRepository = new TaskRepository(database);
  const approvalRepository = new ApprovalRepository(database);
  const messageRepository = new MessageRepository(database);
  const eventLogRepository = new EventLogRepository(database);
  const idempotencyRepository = new IdempotencyRepository(database);

  const policyEngine = new PolicyEngine();
  const llmGateway = new LlmGateway({
    mode: options.llmMode ?? appConfig.LLM_MODE,
    provider: options.llmProvider ?? appConfig.LLM_PROVIDER,
    openAiApiKey: options.openAiApiKey ?? appConfig.OPENAI_API_KEY,
    anthropicApiKey: options.anthropicApiKey ?? appConfig.ANTHROPIC_API_KEY,
  });
  const runtimeAdapter = new MockRuntimeAdapter();
  const eventBus = new EventBus(eventLogRepository);
  const companyGenerator = new CompanyGenerator();
  const idempotencyService = new IdempotencyService(idempotencyRepository);

  const taskOrchestrator = new TaskOrchestrator(
    policyEngine,
    llmGateway,
    runtimeAdapter,
    taskRepository,
    approvalRepository,
    eventBus,
    runRepository,
  );

  const expireApprovalsUseCase = new ExpireApprovalsUseCase(approvalRepository, taskRepository, eventBus);

  return {
    eventBus,
    policyEngine,
    idempotencyService,
    bootstrapCompanyUseCase: new BootstrapCompanyUseCase(
      companyRepository,
      agentRepository,
      agentInstructionRepository,
      runRepository,
      taskRepository,
      eventBus,
      companyGenerator,
      taskOrchestrator,
    ),
    createTaskUseCase: new CreateTaskUseCase(
      companyRepository,
      agentRepository,
      runRepository,
      taskRepository,
      taskOrchestrator,
      eventBus,
    ),
    updateTaskUseCase: new UpdateTaskUseCase(companyRepository, taskRepository, policyEngine, runRepository, eventBus),
    postMessageUseCase: new PostMessageUseCase(companyRepository, messageRepository, runRepository, policyEngine, eventBus),
    decideApprovalUseCase: new DecideApprovalUseCase(
      companyRepository,
      approvalRepository,
      taskRepository,
      runRepository,
      eventBus,
    ),
    expireApprovalsUseCase,
    getCompanyStateUseCase: new GetCompanyStateUseCase(
      companyRepository,
      agentRepository,
      taskRepository,
      approvalRepository,
      eventLogRepository,
      messageRepository,
      runRepository,
      expireApprovalsUseCase,
    ),
    queryCollectionsUseCase: new QueryCollectionsUseCase(
      companyRepository,
      agentRepository,
      taskRepository,
      approvalRepository,
      eventLogRepository,
      runRepository,
    ),
  };
}

export const appContainer = createAppContainer();
export type AppContainer = ReturnType<typeof createAppContainer>;
