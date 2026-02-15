// Detects mutant DNA: 4 identical letters in sequence horizontally, vertically or diagonally.
// A mutant has 2 or more such sequences.

function isMutant(dna) {
  if (!dna || !Array.isArray(dna)) return false;
  const n = dna.length;
  if (n === 0) return false;

  const matrix = dna.map((row) => row.split(''));
  if (!matrix.every((r) => r.length === n)) return false;
  const validChars = new Set(['A', 'T', 'C', 'G']);
  for (const r of matrix) {
    for (const c of r) {
      if (!validChars.has(c)) return false;
    }
  }

  let sequences = 0;
  const seqLen = 4;

  const directions = [
    [0, 1], // right
    [1, 0], // down
    [1, 1], // diag down-right
    [-1, 1] // diag up-right
  ];

  const inBounds = (i, j) => i >= 0 && i < n && j >= 0 && j < n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const char = matrix[i][j];
      for (const [di, dj] of directions) {
        let k = 1;
        let ii = i + di;
        let jj = j + dj;
        while (k < seqLen && inBounds(ii, jj) && matrix[ii][jj] === char) {
          k++;
          ii += di;
          jj += dj;
        }
        if (k === seqLen) {
          sequences++;
          if (sequences >= 2) return true;
        }
      }
    }
  }

  return false;
}

module.exports = { isMutant };