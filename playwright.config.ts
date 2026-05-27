import { defineConfig } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Pass slowMo via SLOW_MO when running (default 1200ms locally, 0 in CI).
 * Examples (PowerShell):
 *   $env:SLOW_MO=0;    npx playwright test tests/moduleNav.spec.ts --headed
 *   $env:SLOW_MO=1200; npx playwright test tests/moduleNav.spec.ts --headed
 * Or use npm scripts: test:module:fast (0ms) / test:module:slow (1200ms)
 */
const slowMoMs =
  process.env.SLOW_MO !== undefined
    ? Number(process.env.SLOW_MO)
    : process.env.CI
      ? 0
      : 1200;
const isSlowRun = slowMoMs > 0;

export default defineConfig({
  testDir: './tests',
  timeout: isSlowRun ? 20 * 60 * 1000 : 10 * 60 * 1000,
  expect: { timeout: isSlowRun ? 30_000 : 25_000 },
  // globalTeardown: './utils/sendreport.ts',
  /* Run tests in files in parallel */
  fullyParallel: false, // Can chage to true if you want to run tests in parallel
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: true,  // Set to false if you want to see the browser actions
    actionTimeout: isSlowRun ? 60_000 : 30_000,
    navigationTimeout: isSlowRun ? 90_000 : 60_000,
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: slowMoMs,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
          slowMo: slowMoMs,
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
],

/* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
