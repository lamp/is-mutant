const Fastify = require('fastify');
const cors = require('@fastify/cors');
const mutantRoute = require('./routes/mutant');
const statsRoute = require('./routes/stats');
const SqliteRepository = require('./db/sqliteRepository');
const path = require('path');

async function buildServer(repo) {
  const fastify = Fastify({ logger: true });

  // CORS - allow all origins in development; lock down in production.
  await fastify.register(cors, { origin: true });

  // Register routes and inject repo
  fastify.register((instance, opts, done) => {
    instance.register(mutantRoute, { repo });
    instance.register(statsRoute, { repo });
    done();
  });

  return fastify;
}

async function createSqliteRepoFromEnv() {
  const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'dna.sqlite');
  const repo = new SqliteRepository(dbFile);
  await repo.init();
  return repo;
}

module.exports = { buildServer, createSqliteRepoFromEnv };