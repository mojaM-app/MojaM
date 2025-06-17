const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '.*\\.(test|spec)\\.ts$',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src' }),
  bail: 1,
  maxConcurrency: 1,
  openHandlesTimeout: 0,
  testTimeout: 30_000,
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.d.ts',
  ],
  coveragePathIgnorePatterns: [
    'index.js',
    'index.jsx',
    'index.ts',
    '<rootDir>/src/dataBase/pascal-naming.strategy.ts',
    '<rootDir>/src/dataBase/migrations/',
    '<rootDir>/src/helpers/tests.utils.ts',
    '<rootDir>/src/helpers/event-handler-tests.helper.ts',
    '<rootDir>/src/modules/announcements/tests/test.helpers.ts',
    '<rootDir>/src/modules/users/tests/test.helpers.ts',
    '<rootDir>/src/config/validateEnv.ts',
    '<rootDir>/src/app.ts',
    '<rootDir>/src/server.ts',
  ],

  verbose: true,
};
