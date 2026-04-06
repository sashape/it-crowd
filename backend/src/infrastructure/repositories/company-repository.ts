import type { Company } from '../../domain/models.js';
import type { DatabaseClient } from '../db/pool.js';

interface CompanyRow {
  id: string;
  name: string;
  prompt: string;
  language: 'ru' | 'en';
  blueprint_status: 'blueprint_draft' | 'blueprint_confirmed';
  created_at: string;
}

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    language: row.language,
    blueprintStatus: row.blueprint_status,
    createdAt: row.created_at,
  };
}

export class CompanyRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(company: Company): Promise<void> {
    await this.database.query(
      `INSERT INTO companies (id, name, prompt, language, blueprint_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [company.id, company.name, company.prompt, company.language, company.blueprintStatus, company.createdAt],
    );
  }

  public async updateBlueprintStatus(companyId: string, status: Company['blueprintStatus']): Promise<void> {
    await this.database.query(`UPDATE companies SET blueprint_status = $2 WHERE id = $1`, [companyId, status]);
  }

  public async getCurrentCompany(): Promise<Company | null> {
    const result = await this.database.query<CompanyRow>(
      `SELECT id, name, prompt, language, blueprint_status, created_at
       FROM companies
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapCompany(result.rows[0]);
  }
}