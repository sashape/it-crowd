import type { Agent } from '~/domain/models.js';

export interface RuntimeExecutionRequest {
  agent: Agent;
  taskId: string;
  runId: string;
  instruction: string;
}

export interface RuntimeExecutionResult {
  success: boolean;
  artifactTitle: string;
  artifactContent: string;
}

export interface RuntimeAdapter {
  provisionAgentRuntime(agent: Agent): Promise<void>;
  executeTask(request: RuntimeExecutionRequest): Promise<RuntimeExecutionResult>;
  collectArtifacts(runId: string, taskId: string): Promise<Array<{ title: string; content: string }>>;
  teardownAgentRuntime(agentId: string): Promise<void>;
}

export class MockRuntimeAdapter implements RuntimeAdapter {
  public async provisionAgentRuntime(): Promise<void> {
    return Promise.resolve();
  }

  public async executeTask(request: RuntimeExecutionRequest): Promise<RuntimeExecutionResult> {
    return {
      success: true,
      artifactTitle: `Result for ${request.taskId}`,
      artifactContent: `Mock runtime output by ${request.agent.name}: ${request.instruction}`,
    };
  }

  public async collectArtifacts(_runId: string, _taskId: string): Promise<Array<{ title: string; content: string }>> {
    return [];
  }

  public async teardownAgentRuntime(): Promise<void> {
    return Promise.resolve();
  }
}