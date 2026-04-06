import type { LlmMode, LlmProvider } from '../../domain/enums.js';
import type { Agent, Task } from '../../domain/models.js';
import { stableNumberFromString } from './utils.js';

export interface LlmGatewayInput {
  mode: LlmMode;
  provider: LlmProvider;
  openAiApiKey?: string;
  anthropicApiKey?: string;
}

export interface GeneratedSubtask {
  title: string;
  description: string;
  role: Agent['role'];
}

export class LlmGateway {
  private readonly mode: LlmMode;
  private readonly provider: LlmProvider;
  private readonly openAiApiKey?: string;
  private readonly anthropicApiKey?: string;

  public constructor(input: LlmGatewayInput) {
    this.mode = input.mode;
    this.provider = input.provider;
    this.openAiApiKey = input.openAiApiKey;
    this.anthropicApiKey = input.anthropicApiKey;
  }

  public async generateSubtasks(task: Task, agents: Agent[]): Promise<GeneratedSubtask[]> {
    if (this.mode === 'mock_static') {
      return this.mockStatic(task);
    }

    if (this.mode === 'mock_deterministic') {
      return this.mockDeterministic(task, agents);
    }

    try {
      const liveResult = await this.liveGeneration(task, agents);
      if (liveResult.length > 0) {
        return liveResult;
      }

      return this.mockDeterministic(task, agents);
    } catch {
      return this.mockDeterministic(task, agents);
    }
  }

  private mockStatic(task: Task): GeneratedSubtask[] {
    return [
      {
        title: `PM: Scope for ${task.title}`,
        description: 'Define measurable scope and acceptance criteria.',
        role: 'pm',
      },
      {
        title: `TL: Technical plan for ${task.title}`,
        description: 'Prepare architecture notes and decomposition.',
        role: 'tl',
      },
      {
        title: `BE: Backend implementation for ${task.title}`,
        description: 'Deliver backend changes and validation.',
        role: 'be',
      },
      {
        title: `FE: Frontend implementation for ${task.title}`,
        description: 'Deliver UI changes and integration checks.',
        role: 'fe',
      },
      {
        title: `QA: Verification for ${task.title}`,
        description: 'Execute test matrix and report findings.',
        role: 'qa',
      },
    ];
  }

  private mockDeterministic(task: Task, agents: Agent[]): GeneratedSubtask[] {
    const seed = stableNumberFromString(`${task.title}:${task.description}`);
    const orderedRoles: Agent['role'][] = ['pm', 'tl', 'be', 'fe', 'qa'];
    const count = 3 + (seed % 3);

    const subtasks: GeneratedSubtask[] = [];
    for (let index = 0; index < count; index += 1) {
      const role = orderedRoles[(index + (seed % orderedRoles.length)) % orderedRoles.length];
      const agentName = agents.find((agent) => agent.role === role)?.name ?? role.toUpperCase();
      subtasks.push({
        title: `${role.toUpperCase()}: ${task.title} #${index + 1}`,
        description: `Deterministic simulation task for ${agentName}. Focus area ${index + 1}.`,
        role,
      });
    }

    return subtasks;
  }

  private async liveGeneration(task: Task, agents: Agent[]): Promise<GeneratedSubtask[]> {
    if (this.provider === 'openai' && this.openAiApiKey) {
      return this.callOpenAi(task, agents);
    }

    if (this.provider === 'anthropic' && this.anthropicApiKey) {
      return this.callAnthropic(task, agents);
    }

    return [];
  }

  private async callOpenAi(task: Task, agents: Agent[]): Promise<GeneratedSubtask[]> {
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Return JSON array only. Each item must include title, description, role. Allowed roles: pm, tl, be, fe, qa.',
        },
        {
          role: 'user',
          content: `Task: ${task.title}\nDescription: ${task.description}\nAgents: ${agents
            .map((agent) => `${agent.role}:${agent.name}`)
            .join(', ')}`,
        },
      ],
      temperature: 0.2,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('openai_request_failed');
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return [];
    }

    return this.parseGeneratedSubtasks(content);
  }

  private async callAnthropic(task: Task, agents: Agent[]): Promise<GeneratedSubtask[]> {
    const body = {
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      temperature: 0.2,
      system: 'Return JSON array only with title, description, role (pm,tl,be,fe,qa).',
      messages: [
        {
          role: 'user',
          content: `Task: ${task.title}\nDescription: ${task.description}\nAgents: ${agents
            .map((agent) => `${agent.role}:${agent.name}`)
            .join(', ')}`,
        },
      ],
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey ?? '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('anthropic_request_failed');
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const textBlock = json.content?.find((entry) => entry.type === 'text')?.text;
    if (!textBlock) {
      return [];
    }

    return this.parseGeneratedSubtasks(textBlock);
  }

  private parseGeneratedSubtasks(raw: string): GeneratedSubtask[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null;
          }

          const title = Reflect.get(entry, 'title');
          const description = Reflect.get(entry, 'description');
          const role = Reflect.get(entry, 'role');
          if (
            typeof title !== 'string' ||
            typeof description !== 'string' ||
            (role !== 'pm' && role !== 'tl' && role !== 'be' && role !== 'fe' && role !== 'qa')
          ) {
            return null;
          }

          return { title, description, role };
        })
        .filter((entry): entry is GeneratedSubtask => entry !== null);
    } catch {
      return [];
    }
  }
}