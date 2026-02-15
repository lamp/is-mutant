import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import DnaForm from './components/DnaForm';
import Stats from './components/Stats';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Mutant Detector</h1>
        <nav>
          <Link to="/">Check DNA</Link> | <Link to="/stats">Stats</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<DnaForm />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}