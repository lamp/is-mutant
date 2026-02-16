/**
 * tests/routes/stats_route.test.js
 *
 * Unit / integration-style tests for the /stats/ route.
 * - Verifies successful stats response (200) with expected JSON payload.
 * - Verifies server returns 500 when the repository.stats() throws.
 *
 * Assumes:
 * - buildServer(repo) is exported from src/server.js and registers the /stats/ route.
 * - Tests run with Jest and Supertest available.
 */

const supertest = require('supertest');
const { buildServer } = require('../../src/server');

jest.setTimeout(10000);

describe('/stats/ route', () => {
  let app;
  let repo;

  afterEach(async () => {
    if (app) {
      try {
        await app.close();
      } catch (e) {
        /* ignore */
      }
      app = null;
    }
  });

  test('returns stats with 200 and correct body', async () => {
    // Mock repo that returns deterministic stats
    repo = {
      stats: async () => ({
        count_mutant_dna: 40,
        count_human_dna: 100,
        ratio: 0.4
      })
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server).get('/stats/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      count_mutant_dna: 40,
      count_human_dna: 100,
      ratio: 0.4
    });
  });

  test('returns 500 when repo.stats throws', async () => {
    // Mock repo whose stats method throws an error
    repo = {
      stats: async () => {
        throw new Error('DB unavailable');
      }
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server).get('/stats/');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    // route returns { error: 'internal_error' } in our implementation
    expect(res.body.error).toBe('internal_error');
  });
});
