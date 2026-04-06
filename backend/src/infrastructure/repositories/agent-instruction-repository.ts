import type { DatabaseClient } from '~/infrastructure/db/pool.js';

export class AgentInstructionRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async createMany(input: Array<{
    id: string;
    companyId: string;
    agentId: string;
    artifactName: string;
    content: string;
    createdAt: string;
  }>): Promise<void> {
    for (const artifact of input) {
      await this.database.query(
        `INSERT INTO agent_instruction_artifacts (
          id, company_id, agent_id, artifact_name, content, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [artifact.id, artifact.companyId, artifact.agentId, artifact.artifactName, artifact.content, artifact.createdAt],
      );
    }
  }
}