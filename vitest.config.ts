import { defineConfig, defineProject } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const appProject = defineProject({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    name: 'app',
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: [
      'tests/e2e/**',
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
      'backend/**',
      'backend/**/*.spec.ts',
      'node_modules/**',
    ],
    setupFiles: ['tests/setup-app.ts'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/unit',
      thresholds: {
        lines: 0.9,
        statements: 0.9,
        branches: 0.9,
        functions: 0.9,
      },
    },
  },
});

const packagesProject = defineProject({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    name: 'packages',
    environment: 'node',
    globals: true,
    include: [
      'packages/**/*.test.{ts,tsx}',
      'packages/**/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      'packages/mobile/e2e/**',
      '**/*.spec.{ts,tsx}',
      'backend/**',
    ],
    setupFiles: ['tests/setup-env.ts'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'reports/refactor/coverage/packages',
      reporter: ['text', 'text-summary', 'lcov'],
      thresholds: { lines: 60 },
    },
  },
});

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  projects: [appProject, packagesProject],
});
