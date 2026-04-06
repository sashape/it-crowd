import type { FastifyReply } from 'fastify';
import { DomainError } from '../../domain/errors.js';

export function sendError(reply: FastifyReply, error: unknown): void {
  if (error instanceof DomainError) {
    if (error.code === 'VALIDATION_FAILED') {
      reply.code(422).send({ success: false, error: error.message, details: error.details });
      return;
    }

    if (error.code === 'POLICY_REJECTED') {
      reply.code(409).send({ success: false, error: error.message, details: error.details });
      return;
    }

    if (error.code === 'NOT_FOUND') {
      reply.code(404).send({ success: false, error: error.message, details: error.details });
      return;
    }

    if (error.code === 'CONFLICT') {
      reply.code(409).send({ success: false, error: error.message, details: error.details });
      return;
    }

    if (error.code === 'RUNTIME_FAILURE') {
      reply.code(502).send({ success: false, error: error.message, details: error.details });
      return;
    }

    reply.code(500).send({ success: false, error: error.message, details: error.details });
    return;
  }

  reply.code(500).send({
    success: false,
    error: error instanceof Error ? error.message : 'Unexpected error',
  });
}