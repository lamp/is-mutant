require('dotenv').config();
const path = require('path');
const SqliteRepository = require('./sqliteRepository');

async function migrate() {
  const dbFile = process.env.SQLITE_FILE || path.join(__dirname, '..', 'src', 'data', 'dna.sqlite');
  const repo = new SqliteRepository(dbFile);
  try {
    await repo.init();
    console.log(`SQLite database initialized at ${dbFile}`);
  } catch (err) {
    console.error('Migration failed', err);
    process.exitCode = 1;
  } finally {
    await repo.close();
  }
}

migrate();