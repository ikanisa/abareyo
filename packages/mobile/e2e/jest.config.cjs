module.exports = {
  preset: 'detox',
  testTimeout: 120000,
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  reporters: ['detox/runners/jest/streamlineReporter'],
  setupFilesAfterEnv: ['detox/runners/jest/adapter'],
};
