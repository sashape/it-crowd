import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { appConfig } from '~/application/services/config.js';

const schemaPath = join(process.cwd(), 'src', 'infrastructure', 'db', 'schema.sql');
const sql = readFileSync(schemaPath, 'utf-8');

const pool = new Pool({ connectionString: appConfig.DATABASE_URL });

async function migrate(): Promise<void> {
  await pool.query(sql);
  await pool.end();
  console.log('Database migration complete.');
}

migrate().catch(async (error: unknown) => {
  console.error('Migration failed', error);
  await pool.end();
  process.exit(1);
});