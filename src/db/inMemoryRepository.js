const crypto = require('crypto');

class InMemoryRepository {
  constructor() {
    this.map = new Map();
  }

  static hashDna(dna) {
    const h = crypto.createHash('sha256');
    h.update(JSON.stringify(dna));
    return h.digest('hex');
  }

  async init() {
    // no-op
  }

  async upsertIfNotExists(dna, is_mutant) {
    const hash = InMemoryRepository.hashDna(dna);
    let rec = this.map.get(hash);
    if (!rec) {
      rec = { hash, dna, is_mutant, id: this.map.size + 1, created_at: new Date().toISOString() };
      this.map.set(hash, rec);
    }
    return rec;
  }

  async findByHash(hash) {
    return this.map.get(hash) || null;
  }

  async stats() {
    let mutant = 0;
    let human = 0;
    for (const v of this.map.values()) {
      if (v.is_mutant) mutant++;
      else human++;
    }
    return {
      count_mutant_dna: mutant,
      count_human_dna: human,
      ratio: human === 0 ? (mutant === 0 ? 0 : 1) : Number((mutant / human).toFixed(2))
    };
  }

  async close() {
    // no-op
  }
}

module.exports = InMemoryRepository;