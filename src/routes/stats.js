module.exports = function (fastify, opts, done) {
  const repo = opts.repo;

  fastify.get('/stats/', async (request, reply) => {
    try {
      const s = await repo.stats();
      return reply.status(200).send(s);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'internal_error' });
    }
  });

  done();
};