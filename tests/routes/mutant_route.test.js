/**
 * tests/routes/mutant_route.test.js
 *
 * Tests for the POST /mutant/ endpoint.
 *
 * Scenarios covered:
 * - returns 200 for mutant DNA and calls repo.upsertIfNotExists with is_mutant = true
 * - returns 403 for human DNA and calls repo.upsertIfNotExists with is_mutant = false
 * - returns 400 for invalid payloads
 * - returns 500 when repo.upsertIfNotExists throws
 *
 * Assumes:
 * - buildServer(repo) is exported from src/server.js and registers the /mutant/ route.
 * - Tests run with Jest and Supertest available.
 */

const supertest = require('supertest');
const { buildServer } = require('../../src/server');

jest.setTimeout(10000);

describe('/mutant/ route', () => {
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

  test('returns 200 for mutant DNA and calls repo.upsertIfNotExists(true)', async () => {
    const mutantDna = ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"];

    // mock repo
    repo = {
      upsertIfNotExists: jest.fn(async (dna, is_mutant) => {
        return { id: 1, hash: 'hash', dna, is_mutant, created_at: new Date().toISOString() };
      })
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server)
      .post('/mutant/')
      .send({ dna: mutantDna })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(repo.upsertIfNotExists).toHaveBeenCalledTimes(1);
    expect(repo.upsertIfNotExists).toHaveBeenCalledWith(mutantDna, true);
    expect(res.body).toHaveProperty('message', 'OK');
  });

  test('returns 403 for human DNA and calls repo.upsertIfNotExists(false)', async () => {
    const humanDna = ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"];

    repo = {
      upsertIfNotExists: jest.fn(async (dna, is_mutant) => {
        return { id: 2, hash: 'hash2', dna, is_mutant, created_at: new Date().toISOString() };
      })
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server)
      .post('/mutant/')
      .send({ dna: humanDna })
      .set('Accept', 'application/json');

    expect(res.status).toBe(403);
    expect(repo.upsertIfNotExists).toHaveBeenCalledTimes(1);
    expect(repo.upsertIfNotExists).toHaveBeenCalledWith(humanDna, false);
    expect(res.body).toHaveProperty('message', 'Forbidden');
  });

  test('returns 400 for invalid payload (missing dna array)', async () => {
    // repo should not be called for invalid payload
    repo = {
      upsertIfNotExists: jest.fn()
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server)
      .post('/mutant/')
      .send({ notdna: [] })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(repo.upsertIfNotExists).not.toHaveBeenCalled();
    expect(res.body).toHaveProperty('error');
  });

  test('returns 500 when repo.upsertIfNotExists throws', async () => {
    const dna = ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"];

    repo = {
      upsertIfNotExists: jest.fn(async () => {
        throw new Error('DB failure');
      })
    };

    app = await buildServer(repo);
    await app.listen({ port: 0 });

    const res = await supertest(app.server)
      .post('/mutant/')
      .send({ dna })
      .set('Accept', 'application/json');

    expect(res.status).toBe(500);
    expect(repo.upsertIfNotExists).toHaveBeenCalled();
    expect(res.body).toHaveProperty('error', 'internal_error');
  });
});
