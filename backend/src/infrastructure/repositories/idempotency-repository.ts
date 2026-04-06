import type { DatabaseClient } from '~/infrastructure/db/pool.js';

export interface StoredIdempotencyRecord {
  responseCode: number;
  responseBody: Record<string, unknown>;
}

interface IdempotencyRow {
  body_hash: string;
  response_code: number;
  response_body: Record<string, unknown>;
}

export class IdempotencyRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async find(requestId: string): Promise<IdempotencyRow | null> {
    const result = await this.database.query<IdempotencyRow>(
      `SELECT body_hash, response_code, response_body
       FROM idempotency_keys
       WHERE id = $1
       AND expires_at >= NOW()`,
      [requestId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  public async save(input: {
    id: string;
    companyId: string | null;
    method: string;
    path: string;
    requestKey: string;
    bodyHash: string;
    responseCode: number;
    responseBody: Record<string, unknown>;
    createdAt: string;
    expiresAt: string;
  }): Promise<void> {
    await this.database.query(
      `INSERT INTO idempotency_keys (
        id, company_id, method, path, request_key, body_hash,
        response_code, response_body, created_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8::jsonb, $9, $10
      )
      ON CONFLICT (id)
      DO UPDATE SET
        response_code = EXCLUDED.response_code,
        response_body = EXCLUDED.response_body,
        body_hash = EXCLUDED.body_hash,
        expires_at = EXCLUDED.expires_at`,
      [
        input.id,
        input.companyId,
        input.method,
        input.path,
        input.requestKey,
        input.bodyHash,
        input.responseCode,
        JSON.stringify(input.responseBody),
        input.createdAt,
        input.expiresAt,
      ],
    );
  }
}