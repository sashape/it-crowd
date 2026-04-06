import type { FastifyPluginAsync } from 'fastify';
import { CreateMessageSchema } from '../../../domain/schemas.js';
import type { AppContainer } from '../../../application/container.js';
import { requireIdempotencyKey } from '../idempotency.js';
import { sendError } from '../error-mapper.js';

export function messageRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/messages', async (request, reply) => {
      try {
        const idempotencyKey = requireIdempotencyKey(request);
        const body = CreateMessageSchema.parse(request.body);

        const result = await container.idempotencyService.execute(
          {
            idempotencyKey,
            method: 'POST',
            path: '/api/messages',
            companyId: null,
            body,
          },
          async () => {
            const posted = await container.postMessageUseCase.execute(body);
            return {
              statusCode: 201,
              payload: {
                success: true,
                message_id: posted.messageId,
                run_id: posted.runId,
              },
            };
          },
        );

        reply.code(result.statusCode).send(result.payload);
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}