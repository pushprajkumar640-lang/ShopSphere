import { env } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './db/pool.js';

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`ShopSphere API listening on port ${env.port} (${env.nodeEnv})`);
});

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
