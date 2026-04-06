import type { Agent } from '~/domain/models.js';
import type { DatabaseClient } from '~/infrastructure/db/pool.js';

interface AgentRow {
  id: string;
  company_id: string;
  role: Agent['role'];
  name: string;
  manager_agent_id: string | null;
  status: Agent['status'];
  model_profile: string;
  runtime_kind: Agent['runtimeKind'];
  delegation_limit: number;
  specialization_hint: string;
  responsibilities: string[];
  tool_policy: Record<string, unknown>;
  created_at: string;
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    companyId: row.company_id,
    role: row.role,
    name: row.name,
    managerAgentId: row.manager_agent_id,
    status: row.status,
    modelProfile: row.model_profile,
    runtimeKind: row.runtime_kind,
    delegationLimit: row.delegation_limit,
    specializationHint: row.specialization_hint,
    responsibilities: row.responsibilities,
    toolPolicy: row.tool_policy,
    createdAt: row.created_at,
  };
}

export class AgentRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async createMany(agents: Agent[]): Promise<void> {
    for (const agent of agents) {
      await this.database.query(
        `INSERT INTO agents (
          id, company_id, role, name, manager_agent_id, status, model_profile, runtime_kind,
          delegation_limit, specialization_hint, responsibilities, tool_policy, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11::jsonb, $12::jsonb, $13
        )`,
        [
          agent.id,
          agent.companyId,
          agent.role,
          agent.name,
          agent.managerAgentId,
          agent.status,
          agent.modelProfile,
          agent.runtimeKind,
          agent.delegationLimit,
          agent.specializationHint,
          JSON.stringify(agent.responsibilities),
          JSON.stringify(agent.toolPolicy),
          agent.createdAt,
        ],
      );
    }
  }

  public async listByCompany(companyId: string): Promise<Agent[]> {
    const result = await this.database.query<AgentRow>(
      `SELECT id, company_id, role, name, manager_agent_id, status, model_profile, runtime_kind,
              delegation_limit, specialization_hint, responsibilities, tool_policy, created_at
       FROM agents
       WHERE company_id = $1
       ORDER BY created_at ASC`,
      [companyId],
    );

    return result.rows.map(mapAgent);
  }

  public async getById(agentId: string): Promise<Agent | null> {
    const result = await this.database.query<AgentRow>(
      `SELECT id, company_id, role, name, manager_agent_id, status, model_profile, runtime_kind,
              delegation_limit, specialization_hint, responsibilities, tool_policy, created_at
       FROM agents
       WHERE id = $1`,
      [agentId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapAgent(result.rows[0]);
  }
}