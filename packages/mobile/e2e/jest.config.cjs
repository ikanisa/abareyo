const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testMatch: ['**/*.e2e.ts'],
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: path.join(__dirname, '../tsconfig.json'),
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
