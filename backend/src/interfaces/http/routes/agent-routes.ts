import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UpdateAgentSchema } from '~/domain/schemas.js';
import type { AppContainer } from '~/application/container.js';
import { sendError } from '~/interfaces/http/error-mapper.js';

const AgentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export function agentRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.patch('/agents/:id', async (request, reply) => {
      try {
        const params = AgentIdParamsSchema.parse(request.params);
        const body = UpdateAgentSchema.parse(request.body);
        const updated = await container.updateAgentUseCase.execute(params.id, body);
        reply.send({ success: true, agent_id: updated.agentId });
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}
