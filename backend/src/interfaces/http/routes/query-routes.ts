import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppContainer } from '../../../application/container.js';
import { sendError } from '../error-mapper.js';

const RunParamsSchema = z.object({
  id: z.string().uuid(),
});

export function queryRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/agents', async (_request, reply) => {
      try {
        const agents = await container.queryCollectionsUseCase.listAgents();
        reply.send({ success: true, agents });
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/events', async (_request, reply) => {
      try {
        const events = await container.queryCollectionsUseCase.listEvents();
        reply.send({ success: true, events });
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/orchestration/runs', async (_request, reply) => {
      try {
        const runs = await container.queryCollectionsUseCase.listRuns();
        reply.send({ success: true, runs });
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/orchestration/runs/:id', async (request, reply) => {
      try {
        const params = RunParamsSchema.parse(request.params);
        const run = await container.queryCollectionsUseCase.getRunById(params.id);
        reply.send({ success: true, run });
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}