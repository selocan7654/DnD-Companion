/* eslint-env node */
/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  coverageThreshold: {
    './src/common/guards/': {
      branches: 80,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/auth/': {
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};

module.exports = config;
