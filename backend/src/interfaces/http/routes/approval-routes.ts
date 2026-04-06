import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { DecideApprovalSchema } from '~/domain/schemas.js';
import type { AppContainer } from '~/application/container.js';
import { requireIdempotencyKey } from '~/interfaces/http/idempotency.js';
import { sendError } from '~/interfaces/http/error-mapper.js';

const ApprovalIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export function approvalRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/approvals/:id/decision', async (request, reply) => {
      try {
        const idempotencyKey = requireIdempotencyKey(request);
        const params = ApprovalIdParamsSchema.parse(request.params);
        const body = DecideApprovalSchema.parse(request.body);

        const result = await container.idempotencyService.execute(
          {
            idempotencyKey,
            method: 'POST',
            path: `/api/approvals/${params.id}/decision`,
            companyId: null,
            body,
          },
          async () => {
            const decided = await container.decideApprovalUseCase.execute(params.id, body);
            return {
              statusCode: 200,
              payload: {
                success: true,
                approval_id: decided.approvalId,
                run_id: decided.runId,
              },
            };
          },
        );

        reply.code(result.statusCode).send(result.payload);
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/approvals', async (_request, reply) => {
      try {
        const approvals = await container.queryCollectionsUseCase.listApprovals();
        reply.send({ success: true, approvals });
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}