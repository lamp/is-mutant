import React, { useEffect, useState } from 'react';
import { getStats } from '../api';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch (err) {
      setError(err.message || 'Failed to fetch');
    }
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15000);
    return () => clearInterval(id);
  }, []);

  if (error) return <div style={{color:'red'}}>Error: {error}</div>;
  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Statistics</h2>
      <div>Mutant: {stats.count_mutant_dna}</div>
      <div>Human: {stats.count_human_dna}</div>
      <div>Ratio: {stats.ratio}</div>
    </div>
  );
}