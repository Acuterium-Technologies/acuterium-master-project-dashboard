/**
 * Playwright config · Phase 3a.05.
 *
 * Visual-regression spec is at tests/hero-brand.spec.ts and asserts the
 * hero lockup at 5 viewports. Local + CI both use:
 *   - storageState from tests/.auth/state.json (seeded by tests/global-setup.ts)
 *   - chromium only (we don't need cross-browser parity for static hero math)
 *
 * Local bootstrap:
 *   $env:DASHBOARD_ACCESS_TOKEN='<token>'
 *   npm run test:visual:update     # capture initial baselines
 *
 * CI bootstrap (.github/workflows/ci.yml visual-regression job):
 *   PLAYWRIGHT_TEST_TOKEN secret → DASHBOARD_ACCESS_TOKEN → globalSetup logs in
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: './tests/.auth/state.json',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
