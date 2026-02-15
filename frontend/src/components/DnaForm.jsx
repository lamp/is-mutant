import React, { useState } from 'react';
import { postDna } from '../api';

const sample = ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"].join('\n');

function validateDnaArray(dna) {
  if (!Array.isArray(dna) || dna.length === 0) return { ok: false, message: 'DNA must be a non-empty array.' };
  const n = dna.length;
  const re = /^[ATCG]+$/i;
  for (const row of dna) {
    if (typeof row !== 'string') return { ok: false, message: 'All DNA rows must be strings.' };
    if (row.length !== n) return { ok: false, message: `Matrix must be square: expected length ${n}, got ${row.length}.` };
    if (!re.test(row)) return { ok: false, message: 'Only A,T,C,G allowed.' };
  }
  if (n > 2000) return { ok: false, message: 'Matrix too large.' };
  return { ok: true };
}

export default function DnaForm() {
  const [text, setText] = useState(sample);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const parseText = (t) => t.split('\n').map(s => s.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const dna = parseText(text);
    const v = validateDnaArray(dna);
    if (!v.ok) return setError(v.message);

    setLoading(true);
    try {
      const res = await postDna({ dna });
      if (res.status === 200) setResult('mutant');
      else setError(`Unexpected status: ${res.status}`);
    } catch (err) {
      if (err.response && err.response.status === 403) setResult('human');
      else setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Check DNA</h2>
      <form onSubmit={handleSubmit}>
        <textarea value={text} onChange={(e) => setText(e.target.value.toUpperCase())} style={{width:'100%',height:220}}/>
        <div style={{marginTop:8}}>
          <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check'}</button>
          <button type="button" onClick={() => setText(sample)} style={{marginLeft:8}}>Load Example</button>
        </div>
      </form>
      {result === 'mutant' && <div style={{color:'green',marginTop:8}}>Mutant detected ✅</div>}
      {result === 'human' && <div style={{color:'red',marginTop:8}}>Human DNA</div>}
      {error && <div style={{color:'orange',marginTop:8}}>Error: {error}</div>}
    </div>
  );
}