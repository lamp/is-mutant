const { isMutant } = require('../..//src/services/dnaService');

describe('isMutant', () => {
  test('returns true for mutant sample (2 sequences)', () => {
    const dna = ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"];
    expect(isMutant(dna)).toBe(true);
  });

  test('returns false for human sample', () => {
    const dna = ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"];
    expect(isMutant(dna)).toBe(false);
  });

  test('rejects non-square input', () => {
    const dna = ["ATG","CAGT"];
    expect(isMutant(dna)).toBe(false);
  });

  test('rejects invalid chars', () => {
    const dna = ["ATX","CAG","TTT"];
    expect(isMutant(dna)).toBe(false);
  });
});