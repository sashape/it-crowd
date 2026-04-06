import { appConfig } from './application/services/config.js';
import { appContainer } from './application/container.js';
import { pool } from './infrastructure/db/pool.js';
import { buildApp } from './app.js';

const app = await buildApp(appContainer);

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: appConfig.PORT, host: appConfig.HOST });
    app.log.info(`Server listening on http://${appConfig.HOST}:${appConfig.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await app.close();
  await pool.end();
  process.exit(0);
});

void start();
