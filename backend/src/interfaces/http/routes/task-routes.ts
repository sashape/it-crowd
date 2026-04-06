import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CreateTaskSchema, UpdateTaskSchema } from '~/domain/schemas.js';
import type { AppContainer } from '~/application/container.js';
import { requireIdempotencyKey } from '~/interfaces/http/idempotency.js';
import { sendError } from '~/interfaces/http/error-mapper.js';

const TaskIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export function taskRoutes(container: AppContainer): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/tasks', async (request, reply) => {
      try {
        const idempotencyKey = requireIdempotencyKey(request);
        const body = CreateTaskSchema.parse(request.body);

        const result = await container.idempotencyService.execute(
          {
            idempotencyKey,
            method: 'POST',
            path: '/api/tasks',
            companyId: null,
            body,
          },
          async () => {
            const created = await container.createTaskUseCase.execute(body);
            return {
              statusCode: 201,
              payload: {
                success: true,
                task_id: created.taskId,
                run_id: created.runId,
                subtask_ids: created.subtaskIds,
              },
            };
          },
        );

        reply.code(result.statusCode).send(result.payload);
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.patch('/tasks/:id', async (request, reply) => {
      try {
        const params = TaskIdParamsSchema.parse(request.params);
        const body = UpdateTaskSchema.parse(request.body);
        const updated = await container.updateTaskUseCase.execute(params.id, body);
        reply.send({ success: true, task_id: updated.taskId, run_id: updated.runId });
      } catch (error) {
        sendError(reply, error);
      }
    });

    fastify.get('/tasks', async (_request, reply) => {
      try {
        const tasks = await container.queryCollectionsUseCase.listTasks();
        reply.send({ success: true, tasks });
      } catch (error) {
        sendError(reply, error);
      }
    });
  };

  return routes;
}