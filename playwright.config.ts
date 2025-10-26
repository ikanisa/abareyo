import { devices, type PlaywrightTestConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);

const config: PlaywrightTestConfig = {
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: `E2E_API_MOCKS=1 NEXT_PUBLIC_BACKEND_URL=http://localhost:${PORT}/api/e2e NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=test SUPABASE_SERVICE_ROLE_KEY=test npm run dev`,
    port: PORT,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      E2E_API_MOCKS: "1",
      NEXT_PUBLIC_BACKEND_URL: `http://localhost:${PORT}/api/e2e`,
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
      SUPABASE_SERVICE_ROLE_KEY: "test",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      testDir: "tests/e2e",
      testIgnore: ["mobile/**"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "nav-audit",
      testDir: "tests",
      testMatch: /nav\..*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "minimal-smoke",
      testDir: "tests",
      testMatch: /minimal\.(?!nav).*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "ussd-only",
      testDir: "tests",
      testMatch: /ussd\.only.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "worldclass",
      testDir: "tests",
      testMatch: /worldclass.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-small",
      testDir: "tests/e2e/mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "mobile-medium",
      testDir: "tests/e2e/mobile",
      use: {
        ...devices["iPad Mini"],
      },
    },
  ],
};

export default config;
