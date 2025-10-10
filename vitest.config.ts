import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'backend/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/unit',
    },
  },
});
