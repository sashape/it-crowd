import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { AppContainer } from './application/container.js';
import { appConfig } from './application/services/config.js';
import { companyRoutes } from './interfaces/http/routes/company-routes.js';
import { taskRoutes } from './interfaces/http/routes/task-routes.js';
import { messageRoutes } from './interfaces/http/routes/message-routes.js';
import { approvalRoutes } from './interfaces/http/routes/approval-routes.js';
import { queryRoutes } from './interfaces/http/routes/query-routes.js';
import { registerEventSocket } from './interfaces/ws/events-socket.js';

export async function buildApp(container: AppContainer): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: appConfig.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH'],
  });

  await app.register(companyRoutes(container), { prefix: '/api' });
  await app.register(taskRoutes(container), { prefix: '/api' });
  await app.register(messageRoutes(container), { prefix: '/api' });
  await app.register(approvalRoutes(container), { prefix: '/api' });
  await app.register(queryRoutes(container), { prefix: '/api' });
  await registerEventSocket(app, container);

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  return app;
}