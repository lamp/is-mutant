const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SqliteRepository {
  constructor(dbFile) {
    // ensure directory exists for file-based DB
    if (dbFile && dbFile !== ':memory:') {
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.dbFile = dbFile || ':memory:';
    this.db = null; // will hold opened DB handle
  }

  async init() {
    // open DB using async wrapper
    this.db = await sqlite.open({
      filename: this.dbFile,
      driver: sqlite3.Database
    });

    // configure pragmas for better concurrency/performance
    await this.db.exec(`PRAGMA journal_mode = WAL;`);
    await this.db.exec(`PRAGMA synchronous = NORMAL;`);

    // create table if not exists
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS dna_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        dna TEXT NOT NULL,
        is_mutant INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_dna_is_mutant ON dna_records(is_mutant);`);
  }

  static hashDna(dna) {
    const h = crypto.createHash('sha256');
    h.update(JSON.stringify(dna));
    return h.digest('hex');
  }

  async upsertIfNotExists(dna, is_mutant) {
    const hash = SqliteRepository.hashDna(dna);
    // Use INSERT OR IGNORE to avoid race errors; selecting afterwards returns the row
    const insertSql = `INSERT OR IGNORE INTO dna_records (hash, dna, is_mutant) VALUES (?, ?, ?);`;
    await this.db.run(insertSql, [hash, JSON.stringify(dna), is_mutant ? 1 : 0]);

    const row = await this.db.get(
      `SELECT id, hash, dna, is_mutant, created_at FROM dna_records WHERE hash = ?;`,
      [hash]
    );

    return {
      id: row.id,
      hash: row.hash,
      dna: JSON.parse(row.dna),
      is_mutant: !!row.is_mutant,
      created_at: row.created_at
    };
  }

  async findByHash(hash) {
    const row = await this.db.get(
      `SELECT id, hash, dna, is_mutant, created_at FROM dna_records WHERE hash = ?;`,
      [hash]
    );
    if (!row) return null;
    return {
      id: row.id,
      hash: row.hash,
      dna: JSON.parse(row.dna),
      is_mutant: !!row.is_mutant,
      created_at: row.created_at
    };
  }

  async stats() {
    const row = await this.db.get(`
      SELECT
        SUM(CASE WHEN is_mutant = 1 THEN 1 ELSE 0 END) AS mutant_count,
        SUM(CASE WHEN is_mutant = 0 THEN 1 ELSE 0 END) AS human_count
      FROM dna_records;
    `);
    const mutant = Number(row.mutant_count || 0);
    const human = Number(row.human_count || 0);
    return {
      count_mutant_dna: mutant,
      count_human_dna: human,
      ratio: human === 0 ? (mutant === 0 ? 0 : 1) : Number((mutant / human).toFixed(2))
    };
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

module.exports = SqliteRepository;