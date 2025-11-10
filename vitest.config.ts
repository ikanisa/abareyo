import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { defineConfig, defineProject } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const fromRoot = (...segments: string[]) =>
  resolve(dirname(fileURLToPath(new URL('./', import.meta.url))), ...segments);

const alias = {
  '@/app': fromRoot('app'),
  '@/app/': `${fromRoot('app')}/`,
  '@admin': fromRoot('app/admin'),
  '@admin/': `${fromRoot('app/admin')}/`,
  '@': fromRoot('src'),
  '@/': `${fromRoot('src')}/`,
};

const aliasEntries = Object.entries(alias);

const createAliasPlugin = () => ({
  name: 'workspace-alias-resolver',
  enforce: 'pre' as const,
  resolveId(source: string) {
    for (const [key, target] of aliasEntries) {
      if (source === key) {
        return target;
      }

      if (key.endsWith('/') && source.startsWith(key)) {
        return `${target}${source.slice(key.length)}`;
      }
    }

    return null;
  },
});

const appProject = defineProject({
  plugins: [createAliasPlugin(), tsconfigPaths({ extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'] })],
  resolve: { alias },
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
    alias: {
      '@/app': fromRoot('app'),
      '@admin': fromRoot('app/admin'),
      '@': fromRoot('src'),
    },
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
  plugins: [createAliasPlugin(), tsconfigPaths({ extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'] })],
  resolve: { alias },
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
    exclude: ['**/node_modules/**'],
    alias: {
      '@/app': fromRoot('app'),
      '@admin': fromRoot('app/admin'),
      '@': fromRoot('src'),
    },
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
  plugins: [createAliasPlugin()],
  resolve: { alias },
  test: {
    tsconfig: 'tsconfig.json',
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
