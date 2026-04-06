import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import type { AppContainer } from '~/application/container.js';

interface SocketConnection {
  send: (message: string) => void;
  close: () => void;
}

export async function registerEventSocket(fastify: FastifyInstance, container: AppContainer): Promise<void> {
  await fastify.register(websocket);

  const clients = new Set<SocketConnection>();
  const unsubscribe = container.eventBus.subscribe((event) => {
    const payload = JSON.stringify(event);
    for (const client of clients) {
      try {
        client.send(payload);
      } catch {
        client.close();
        clients.delete(client);
      }
    }
  });

  fastify.get('/ws/events', { websocket: true }, (socket) => {
    const ws = socket;
    clients.add(ws as unknown as SocketConnection);

    ws.send(
      JSON.stringify({
        type: 'system.connected',
        ts: new Date().toISOString(),
      }),
    );

    const heartbeat = setInterval(() => {
      try {
        ws.send(
          JSON.stringify({
            type: 'system.heartbeat',
            ts: new Date().toISOString(),
          }),
        );
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    ws.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(ws as unknown as SocketConnection);
    });
  });

  fastify.addHook('onClose', (_instance, done) => {
    unsubscribe();
    for (const client of clients) {
      client.close();
    }
    clients.clear();
    done();
  });
}