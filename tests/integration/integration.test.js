/**
 * Integration tests that run the real Fastify server backed by an async SQLite file.
 *
 * - Creates a temporary sqlite file for each test run
 * - Starts the server with a SqliteRepository instance
 * - Exercises POST /mutant/ and GET /stats/ endpoints using supertest
 * - Verifies behavior and that records are deduplicated
 *
 * Run:
 *   npm test
 *
 * Note: these tests expect your project to export buildServer from src/server.js
 * and the SqliteRepository class located at src/db/sqliteRepository.js.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { buildServer } = require('../../src/server');
const SqliteRepository = require('../../src/db/sqliteRepository');

jest.setTimeout(20000);

describe('SQLite-backed integration tests', () => {
  let repo;
  let app;

  // temp sqlite file path
  const tmpSqliteFile = path.join(
    os.tmpdir(),
    `dna-integration-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
  );

  beforeAll(async () => {
    // create and init repo, then start server
    repo = new SqliteRepository(tmpSqliteFile);
    await repo.init();
    app = await buildServer(repo);
    // listen on random available port
    await app.listen({ port: 0 });
  });

  afterAll(async () => {
    // close server and db, then remove temp file
    try {
      if (app) await app.close();
    } catch (err) {
      // ignore
    }
    try {
      if (repo) await repo.close();
    } catch (err) {
      // ignore
    }
    try {
      if (fs.existsSync(tmpSqliteFile)) fs.unlinkSync(tmpSqliteFile);
    } catch (err) {
      // ignore
    }
  });

  test('POST /mutant/ with mutant DNA returns 200 and is stored', async () => {
    const mutantPayload = {
      dna: ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"]
    };

    const res = await supertest(app.server)
      .post('/mutant/')
      .send(mutantPayload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);

    // stats should reflect one mutant
    const statsRes = await supertest(app.server).get('/stats/');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.count_mutant_dna).toBe(1);
    expect(statsRes.body.count_human_dna).toBe(0);

    // ensure the record exists in the sqlite DB via repo.findByHash
    const hash = SqliteRepository.hashDna(mutantPayload.dna);
    const row = await repo.findByHash(hash);
    expect(row).not.toBeNull();
    expect(row.is_mutant).toBe(true);
    expect(Array.isArray(row.dna)).toBe(true);
    expect(row.dna.length).toBe(mutantPayload.dna.length);
  });

  test('POST /mutant/ with human DNA returns 403 and deduplicates repeated submissions', async () => {
    const humanPayload = {
      dna: ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"]
    };

    const first = await supertest(app.server)
      .post('/mutant/')
      .send(humanPayload)
      .set('Accept', 'application/json');

    expect(first.status).toBe(403);

    // Submit the same human payload twice more to test deduplication
    await supertest(app.server).post('/mutant/').send(humanPayload).set('Accept', 'application/json');
    await supertest(app.server).post('/mutant/').send(humanPayload).set('Accept', 'application/json');

    const statsRes = await supertest(app.server).get('/stats/');
    expect(statsRes.status).toBe(200);
    // mutant count remains from previous test (1), human count should be exactly 1 (deduplicated)
    expect(statsRes.body.count_human_dna).toBe(1);
  });
});
