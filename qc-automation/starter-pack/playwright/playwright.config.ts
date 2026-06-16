import { defineConfig, devices } from '@playwright/test';

// Standard QC config — retries, trace/screenshot/video on fail, multi-browser, sharding-ready.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  timeout: 30_000, // per-test timeout — no test runs unbounded (see process-gates.md)
  reporter: [['html', { open: 'never' }], ['list'], ['junit', { outputFile: 'results.xml' }]],
  // Deterministic visual snapshots (see visual-a11y.md): freeze animations + caret.
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide' } },
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Each device pins a fixed viewport + deviceScaleFactor, which keeps visual
  // snapshots stable across machines (see visual-a11y.md).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
