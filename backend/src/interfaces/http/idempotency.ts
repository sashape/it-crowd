import type { FastifyRequest } from 'fastify';
import { DomainError } from '~/domain/errors.js';

export function requireIdempotencyKey(request: FastifyRequest): string {
  const header = request.headers['idempotency-key'];
  if (!header || typeof header !== 'string' || header.trim().length === 0) {
    throw new DomainError('VALIDATION_FAILED', 'Idempotency-Key header is required.');
  }

  return header;
}