import type { IdempotencyRepository } from '~/infrastructure/repositories/idempotency-repository.js';
import { DomainError } from '~/domain/errors.js';
import { hashPayload, nowIso } from '~/application/services/utils.js';

export interface IdempotencyContext {
  idempotencyKey: string;
  method: string;
  path: string;
  companyId: string | null;
  body: unknown;
}

export interface IdempotentResult {
  statusCode: number;
  payload: Record<string, unknown>;
}

export class IdempotencyService {
  public constructor(private readonly repository: IdempotencyRepository) {}

  public async execute(context: IdempotencyContext, handler: () => Promise<IdempotentResult>): Promise<IdempotentResult> {
    const bodyHash = hashPayload(context.body);
    const storageId = `${context.method}:${context.path}:${context.companyId ?? 'none'}:${context.idempotencyKey}`;

    const existing = await this.repository.find(storageId);
    if (existing) {
      if (existing.body_hash !== bodyHash) {
        throw new DomainError('CONFLICT', 'Idempotency key reused with different payload.', {
          existingBodyHash: existing.body_hash,
          currentBodyHash: bodyHash,
        });
      }

      return {
        statusCode: existing.response_code,
        payload: existing.response_body,
      };
    }

    const result = await handler();
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await this.repository.save({
      id: storageId,
      companyId: context.companyId,
      method: context.method,
      path: context.path,
      requestKey: context.idempotencyKey,
      bodyHash,
      responseCode: result.statusCode,
      responseBody: result.payload,
      createdAt,
      expiresAt,
    });

    return result;
  }
}