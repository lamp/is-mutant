module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    'src/index.js',
    'src/db/migrate.js',
    // inMemoryRepository is only for testing, so we exclude it from coverage requirements
    'src/db/inMemoryRepository.js',
    // server.js is mostly wiring and doesn't have much logic to cover, so we exclude it from coverage requirements
    'src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
