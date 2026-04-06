import type { FastifyPluginAsync } from 'fastify';
import { BootstrapCompanySchema } from '~/domain/schemas.js';
import type { AppContainer } from '~/application/container.js';
import { requireIdempotencyKey } from '~/interfaces/http/idempotency.js';
import { sendError } from '~/interfaces/http/error-mapper.js';

export function companyRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/company/bootstrap', async (request, reply) => {
      try {
        const idempotencyKey = requireIdempotencyKey(request);
        const body = BootstrapCompanySchema.parse(request.body);

        const result = await container.idempotencyService.execute(
          {
            idempotencyKey,
            method: 'POST',
            path: '/api/company/bootstrap',
            companyId: null,
            body,
          },
          async () => {
            const payload = await container.bootstrapCompanyUseCase.execute(body);
            return {
              statusCode: 201,
              payload: {
                success: true,
                company_id: payload.companyId,
                blueprint: payload.blueprint,
                agents: payload.agents,
                initial_tasks: payload.initialTasks,
                run_id: payload.runId,
              },
            };
          },
        );

        reply.code(result.statusCode).send(result.payload);
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/company/state', async (request, reply) => {
      try {
        const includeRaw = (request.query as { include?: string }).include;
        const include = new Set((includeRaw ?? 'agents,tasks,approvals,recent_events,runs').split(','));
        const state = await container.getCompanyStateUseCase.execute(include);
        reply.send({ success: true, ...state });
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}