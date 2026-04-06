import type { QueryResult, QueryResultRow } from 'pg';
import { Pool } from 'pg';
import { appConfig } from '~/application/services/config.js';

export interface DatabaseClient {
  query<T extends QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export const pool = new Pool({ connectionString: appConfig.DATABASE_URL });

export const db: DatabaseClient = {
  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    return pool.query<T>(sql, params);
  },
};
