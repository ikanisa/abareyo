import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'backend/**', 'node_modules/**'],
    setupFiles: ['tests/setup-env.ts'],
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
    testTimeout: 15000,
  },
});
