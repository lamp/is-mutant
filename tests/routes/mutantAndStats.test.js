const { buildServer } = require('../../src/server');
const InMemoryRepository = require('../../src/db/inMemoryRepository');
const supertest = require('supertest');

let app;
let repo;

beforeAll(async () => {
  repo = new InMemoryRepository();
  await repo.init();
  app = await buildServer(repo);
  await app.listen({ port: 0 }); // random port
});

afterAll(async () => {
  await repo.close();
  await app.close();
});

describe('/mutant/ and /stats/', () => {
  test('returns 200 for mutant and stores it', async () => {
    const dna = { dna: ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"] };
    const res = await supertest(app.server).post('/mutant/').send(dna);
    expect(res.status).toBe(200);

    const stats = await supertest(app.server).get('/stats/');
    expect(stats.status).toBe(200);
    expect(stats.body.count_mutant_dna).toBe(1);
  });

  test('returns 403 for human and stores it only once', async () => {
    const dna = { dna: ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"] };
    const res = await supertest(app.server).post('/mutant/').send(dna);
    expect(res.status).toBe(403);

    const stats = await supertest(app.server).get('/stats/');
    expect(stats.status).toBe(200);
    expect(stats.body.count_human_dna).toBe(1);
  });

  test('deduplicates identical DNA submissions', async () => {
    const dna = { dna: ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"] };
    await supertest(app.server).post('/mutant/').send(dna);
    await supertest(app.server).post('/mutant/').send(dna);
    const stats = await supertest(app.server).get('/stats/');
    expect(stats.body.count_human_dna).toBe(1); // still 1
  });
});