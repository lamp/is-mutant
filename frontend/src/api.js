import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL, timeout: 5000, headers: { 'Content-Type': 'application/json' } });

export function postDna(dna) {
  return api.post('/mutant/', dna);
}

export async function getStats() {
  const res = await api.get('/stats/');
  return res.data;
}