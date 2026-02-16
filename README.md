# Mutant Detector (JavaScript + SQLite + React frontend)

This repository contains:
- Backend: Fastify API (POST /mutant/ and GET /stats/) using SQLite (async).
- Frontend: React + Vite single-page app to submit DNA and view stats.
- Tests: Jest + Supertest (use in-memory repo for route tests).

### Quick start (backend)
1. Install:
   npm install

2. Initialize SQLite DB:
   npm run migrate

3. Start server:
   npm start

Development with auto reload:
   npm run dev

Run tests:
   npm test

### Quickstart (frontend)

- npm install
- npm run dev

### Api Documentation
API
- POST /mutant/
  Request:
  {
    "dna": ["ATGCGA", "CAGTGC", ...]
  }
  Response:
   - 200 OK -> mutant detected
   - 403 Forbidden -> human DNA
   - 400 Bad Request -> invalid payload

- GET /stats/
  Response:
  {
    "count_mutant_dna": 40,
    "count_human_dna": 100,
    "ratio": 0.4
  }

Frontend
- In the `frontend/` folder there is a Vite-based React app.
- Configure API base URL (optional) with VITE_API_URL env var when running the frontend.

Notes
- The backend uses an asynchronous sqlite driver (sqlite + sqlite3).
- For heavy scale, consider moving persistence to a queue/batcher or an external DB for multi-process writes.
- Tests use an in-memory repository; they do not require SQLite.
- To improve the stats endpoint performance, consider caching the results or using a more efficient data structure to track counts without needing to query the entire database each time.

### Architecture diagram (simplified):

[Productionised Architecture Diagram](architecture-production.svg)
[Current Architecture Diagram](architecture-current.svg)

### Performance and Scalability
- The mutant detection algorithm runs in O(N^2) time, which is efficient for typical DNA sizes (e.g., 6x6).
- SQLite is sufficient for moderate loads, but for high concurrency, consider using a more robust database or implementing a write queue to batch updates.
- The API is designed to be stateless, allowing for horizontal scaling of the backend if needed.
- The frontend is a single-page application that can be served from any static hosting service, and it communicates with the backend via RESTful API calls.
- Caching strategies can be implemented for the stats endpoint to reduce database load, especially if the stats are updated infrequently.
- Using ab I got the following performance metrics for the POST /mutant/ endpoint:
  - 1000000 requests with concurrency of 50: average response time of 4ms, with 100% success rate.
  - To run the same performance test I used it is available at ab_test.sh in the repository.

