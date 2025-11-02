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
      'tests/unit/app/**',
      'backend/**',
      'node_modules/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    setupFiles: ['tests/setup-app.ts'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/unit',
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 90,
        functions: 90,
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
      'packages/**/*.{test,spec}.{ts,tsx}',
      'packages/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', 'packages/mobile/e2e/**'],
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
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      'tests/e2e/**',
      'backend/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  projects: [appProject, packagesProject],
});
