import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { QueryResult, QueryResultRow } from 'pg';
import { DataType, newDb } from 'pg-mem';
import { createAppContainer, type AppContainer } from '../../src/application/container.js';
import { buildApp } from '../../src/app.js';

export interface TestDatabaseClient {
  query<T extends QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

export async function createTestDatabaseClient(): Promise<TestDatabaseClient> {
  const memoryDb = newDb();
  memoryDb.public.registerFunction({
    name: 'now',
    returns: DataType.timestamptz,
    implementation: () => new Date(),
  });

  const schemaPath = join(process.cwd(), 'src', 'infrastructure', 'db', 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  memoryDb.public.none(schemaSql);

  const { Pool } = memoryDb.adapters.createPg();
  const pool = new Pool();

  return {
    async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
      return pool.query(sql, params) as Promise<QueryResult<T>>;
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}

export async function createTestApp(): Promise<{
  app: Awaited<ReturnType<typeof buildApp>>;
  container: AppContainer;
  database: TestDatabaseClient;
  cleanup: () => Promise<void>;
}> {
  const testDatabase = await createTestDatabaseClient();
  const container = createAppContainer({
    database: testDatabase,
    llmMode: 'mock_deterministic',
  });
  const app = await buildApp(container);

  return {
    app,
    container,
    database: testDatabase,
    cleanup: async (): Promise<void> => {
      await app.close();
      await testDatabase.close();
    },
  };
}
