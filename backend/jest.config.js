/* eslint-disable */
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
  coveragePathIgnorePatterns: [
    'index.js',
    'index.jsx',
    'index.ts',
    '<rootDir>/src/dataBase/pascal-naming.strategy.ts',
    '<rootDir>/src/dataBase/migrations/',
    '<rootDir>/src/utils/tests.utils.ts',
    '<rootDir>/src/helpers/user-tests.helpers.ts',
    '<rootDir>/src/helpers/event-handler-test.helpers.ts',
    '<rootDir>/src/modules/announcements/tests/announcements-tests.helpers.ts',
    '<rootDir>/src/config/validateEnv.ts',
    '<rootDir>/src/app.ts',
  ],
};
