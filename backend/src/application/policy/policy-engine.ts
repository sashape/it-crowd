import type { PolicyDecision } from '../../domain/errors.js';
import type { ApprovalType, RiskLevel, TaskPhase, TaskStatus } from '../../domain/enums.js';
import type { Task } from '../../domain/models.js';

export interface PolicyLimits {
  maxDelegationDepth: number;
  maxSubtasksPerDecomposition: number;
  maxAgentMessagesPerTaskPerRun: number;
  maxReopenCount: number;
  maxApprovalsPerTask: number;
  maxOrchestrationStepsBeforeWarning: number;
}

export const defaultPolicyLimits: PolicyLimits = {
  maxDelegationDepth: 3,
  maxSubtasksPerDecomposition: 6,
  maxAgentMessagesPerTaskPerRun: 12,
  maxReopenCount: 2,
  maxApprovalsPerTask: 3,
  maxOrchestrationStepsBeforeWarning: 30,
};

const statusTransitions: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['review', 'blocked'],
  review: ['done', 'in_progress', 'blocked'],
  done: ['review'],
  blocked: ['todo', 'review'],
};

export class PolicyEngine {
  public constructor(private readonly limits: PolicyLimits = defaultPolicyLimits) {}

  public canCreateSubtasks(depth: number, subtaskCount: number): PolicyDecision {
    if (depth >= this.limits.maxDelegationDepth) {
      return { allowed: false, reason: 'max_delegation_depth_exceeded', requiresApproval: false };
    }

    if (subtaskCount > this.limits.maxSubtasksPerDecomposition) {
      return { allowed: false, reason: 'max_subtasks_exceeded', requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public canSendAgentMessage(messageCountForTaskRun: number): PolicyDecision {
    if (messageCountForTaskRun >= this.limits.maxAgentMessagesPerTaskPerRun) {
      return { allowed: false, reason: 'max_agent_messages_exceeded', requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public canReopenTask(currentReopenCount: number): PolicyDecision {
    if (currentReopenCount >= this.limits.maxReopenCount) {
      return { allowed: false, reason: 'max_reopen_count_exceeded', requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public canRequestApproval(existingApprovalsForTask: number): PolicyDecision {
    if (existingApprovalsForTask >= this.limits.maxApprovalsPerTask) {
      return { allowed: false, reason: 'max_approvals_exceeded', requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public canAdvanceRunStep(currentStepCount: number): PolicyDecision {
    if (currentStepCount >= this.limits.maxOrchestrationStepsBeforeWarning) {
      return { allowed: false, reason: 'max_orchestration_steps_exceeded', requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public evaluateRiskyAction(task: Task): { approvalRequired: boolean; approvalType: ApprovalType } {
    if (task.kind === 'external_action' || task.kind === 'deployment' || task.riskLevel === 'critical') {
      return { approvalRequired: true, approvalType: 'external_action' };
    }

    if (task.riskLevel === 'high') {
      return { approvalRequired: true, approvalType: 'risk_override' };
    }

    return { approvalRequired: false, approvalType: 'quality_clarification' };
  }

  public canTransitionStatus(currentStatus: TaskStatus, nextStatus: TaskStatus): PolicyDecision {
    const allowedTargets = statusTransitions[currentStatus] ?? [];
    if (!allowedTargets.includes(nextStatus)) {
      return { allowed: false, reason: `invalid_status_transition_${currentStatus}_to_${nextStatus}`, requiresApproval: false };
    }

    return { allowed: true, reason: 'allowed', requiresApproval: false };
  }

  public inferPhaseForStatus(status: TaskStatus): TaskPhase {
    if (status === 'todo') {
      return 'planning';
    }

    if (status === 'in_progress') {
      return 'execution';
    }

    if (status === 'review') {
      return 'review';
    }

    if (status === 'done') {
      return 'done';
    }

    return 'blocked';
  }

  public getLimits(): PolicyLimits {
    return this.limits;
  }
}