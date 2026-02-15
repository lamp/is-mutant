const { isMutant } = require('../services/dnaService');

module.exports = function (fastify, opts, done) {
  const repo = opts.repo;

  fastify.post('/mutant/', async (request, reply) => {
    const body = request.body;
    if (!body || !Array.isArray(body.dna)) {
      return reply.status(400).send({ error: 'Invalid payload, expected { dna: [ ... ] }' });
    }

    const dna = body.dna;
    try {
      const mutant = isMutant(dna);
      await repo.upsertIfNotExists(dna, mutant);
      if (mutant) {
        return reply.status(200).send({ message: 'OK' });
      } else {
        return reply.status(403).send({ message: 'Forbidden' });
      }
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'internal_error' });
    }
  });

  done();
};