import type { CreateMessageInput } from '../../domain/schemas.js';
import type { CompanyRepository } from '../../infrastructure/repositories/company-repository.js';
import type { MessageRepository } from '../../infrastructure/repositories/message-repository.js';
import type { EventBus } from '../services/event-bus.js';
import type { PolicyEngine } from '../policy/policy-engine.js';
import type { OrchestrationRunRepository } from '../../infrastructure/repositories/orchestration-run-repository.js';
import type { Message } from '../../domain/models.js';
import { HandoffPayloadSchema } from '../../domain/schemas.js';
import { DomainError } from '../../domain/errors.js';
import { createDomainEvent } from '../services/event-factory.js';
import { createId, nowIso } from '../services/utils.js';

export class PostMessageUseCase {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly messageRepository: MessageRepository,
    private readonly runRepository: OrchestrationRunRepository,
    private readonly policyEngine: PolicyEngine,
    private readonly eventBus: EventBus,
  ) {}

  public async execute(input: CreateMessageInput): Promise<{ messageId: string; runId: string }> {
    const company = await this.companyRepository.getCurrentCompany();
    if (!company) {
      throw new DomainError('NOT_FOUND', 'Company is not bootstrapped yet.');
    }

    if (input.message_type === 'handoff') {
      const validation = HandoffPayloadSchema.safeParse(input.payload);
      if (!validation.success) {
        throw new DomainError('VALIDATION_FAILED', 'Invalid handoff payload.', {
          errors: validation.error.issues,
        });
      }
    }

    const runId = input.run_id ?? createId();
    const traceId = createId();

    const existingRun = input.run_id ? await this.runRepository.getById(input.run_id) : null;
    if (!existingRun) {
      await this.runRepository.create({
        runId,
        companyId: company.id,
        status: 'running',
        outcome: null,
        triggerType: input.message_type === 'human_instruction' ? 'human_instruction' : 'task_update',
        triggerRef: input.task_id ?? input.thread_id,
        stepCount: 0,
        warningReason: null,
        startedAt: nowIso(),
        finishedAt: null,
      });
    }

    if (input.sender_type === 'agent' && input.task_id && runId) {
      const count = await this.messageRepository.countAgentMessagesByRunTask(runId, input.task_id);
      const decision = this.policyEngine.canSendAgentMessage(count);
      if (!decision.allowed) {
        await this.runRepository.finalize(runId, 'finished', 'stopped_by_policy', decision.reason);
        throw new DomainError('POLICY_REJECTED', 'Agent message quota exceeded.', {
          reason: decision.reason,
        });
      }
    }

    const message: Message = {
      id: createId(),
      companyId: company.id,
      runId,
      taskId: input.task_id ?? null,
      threadId: input.thread_id,
      messageType: input.message_type,
      messageSchemaVersion: 1,
      senderType: input.sender_type,
      senderAgentId: input.sender_agent_id ?? null,
      content: input.content,
      payload: input.payload,
      mentionedAgentId: input.mentioned_agent_id ?? null,
      requiresResponse: input.requires_response,
      createdAt: nowIso(),
    };

    await this.messageRepository.create(message);

    await this.eventBus.publish(
      createDomainEvent({
        eventType: 'message.posted',
        companyId: company.id,
        runId,
        traceId,
        entityType: 'message',
        entityId: message.id,
        causedByType: message.senderType,
        causedById: message.senderAgentId ?? 'founder',
        payload: {
          thread_id: message.threadId,
          message_type: message.messageType,
          message_schema_version: message.messageSchemaVersion,
          task_id: message.taskId,
        },
      }),
    );

    if (input.mentioned_agent_id) {
      await this.eventBus.publish(
        createDomainEvent({
          eventType: 'agent.pinged_human',
          companyId: company.id,
          runId,
          traceId,
          entityType: 'agent',
          entityId: input.mentioned_agent_id,
          causedByType: message.senderType,
          causedById: message.senderAgentId ?? 'founder',
          payload: {
            reason: 'mention',
            thread_id: message.threadId,
          },
        }),
      );
    }

    if (input.message_type === 'human_instruction') {
      await this.runRepository.finalize(runId, 'finished', 'completed', null);
    }

    return {
      messageId: message.id,
      runId,
    };
  }
}