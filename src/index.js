require('dotenv').config();
const { createSqliteRepoFromEnv, buildServer } = require('./server');

const PORT = Number(process.env.PORT || 3000);

async function start() {
  const repo = await createSqliteRepoFromEnv();
  const server = await buildServer(repo);

  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    server.log.info('Shutting down...');
    await repo.close();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});