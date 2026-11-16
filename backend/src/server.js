import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.PORT, () => console.log(`Sistema Âncora API ouvindo na porta ${env.PORT}`));

async function shutdown(signal) {
  console.log(`${signal}: encerrando API...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
