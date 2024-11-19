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
  coveragePathIgnorePatterns: ['<rootDir>/src/dataBase/pascal-naming.strategy.ts', '<rootDir>/src/dataBase/migrations/'],
};
