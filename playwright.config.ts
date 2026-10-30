import { join } from 'node:path';

import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const isDevMode = process.env.NODE_ENV === 'development';

/**
 * A second server protected with a password, used by the password spec
 * it has its own port and data folder so it does not share state with the main server
 * it serves the built client, which the dev mode flow does not otherwise build
 */
const passwordServer = {
  command: isDevMode
    ? 'pnpm --filter ontime-ui build && pnpm --filter ontime-server dev'
    : 'pnpm --filter ontime-server dev',
  port: 4002,
  reuseExistingServer: true,
  timeout: 60 * 1000,
  env: {
    PORT: '4002',
    SESSION_PASSWORD: 'e2e-password',
    ONTIME_DATA: join(import.meta.dirname, 'e2e/tests/fixtures/tmp/password-server'),
  },
};

/**
 * The main server under test.
 *
 * Its data folder is isolated like the password server's: without ONTIME_DATA the
 * suite runs against the developer's real Chronous data, and the specs create and
 * delete rundowns. PORT is pinned for the same reason the data folder is - the
 * server otherwise reads a stored port from app-state.json, which on a machine that
 * has run the app before is whatever port it last used, and Playwright then waits on
 * 4001 until its 60s timeout with no test ever executing.
 *
 * In dev mode the client dev server owns 3000, so only the data folder is overridden
 * there.
 */
const mainServer = {
  command: isDevMode ? 'turbo run dev' : 'turbo run dev --filter=ontime-server',
  port: isDevMode ? 3000 : 4001,
  reuseExistingServer: true,
  timeout: 60 * 1000,
  env: {
    ...(isDevMode ? {} : { PORT: '4001' }),
    ONTIME_DATA: join(import.meta.dirname, 'e2e/tests/fixtures/tmp/main-server'),
  },
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './e2e/tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  webServer: [mainServer, passwordServer],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,
    baseURL: isDevMode ? 'http://localhost:3000' : 'http://localhost:4001',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.CI ? undefined : 250,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  outputDir: 'test-results/',
};

export default config;
