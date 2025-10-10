import type { PlaywrightTestConfig } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);

const config: PlaywrightTestConfig = {
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `E2E_API_MOCKS=1 NEXT_PUBLIC_BACKEND_URL=http://localhost:${PORT}/api/e2e npm run dev`,
    port: PORT,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      E2E_API_MOCKS: '1',
      NEXT_PUBLIC_BACKEND_URL: `http://localhost:${PORT}/api/e2e`,
    },
  },
  testDir: 'tests/e2e',
};

export default config;

