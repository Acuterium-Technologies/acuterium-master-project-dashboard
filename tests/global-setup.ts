/**
 * Playwright global setup · Phase 3a.05.
 *
 * Authenticates once via POST /api/login → saves storage state at
 * tests/.auth/state.json. The visual-regression spec inherits this state
 * via playwright.config.ts `use.storageState`.
 *
 * Token source (in order):
 *   1. PLAYWRIGHT_TEST_TOKEN  (CI-set GitHub Actions secret)
 *   2. DASHBOARD_ACCESS_TOKEN (local dev fallback)
 *
 * No-op when neither is set — `/` will redirect to /login and the spec
 * will fail loudly (operator sees a 401/redirect rather than a confusing
 * screenshot diff). This keeps the failure mode explicit.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';

const AUTH_DIR = './tests/.auth';
const STATE_PATH = path.join(AUTH_DIR, 'state.json');

export default async function globalSetup(config: FullConfig): Promise<void> {
  const token = process.env.PLAYWRIGHT_TEST_TOKEN || process.env.DASHBOARD_ACCESS_TOKEN;
  if (!token) {
    console.warn(
      '[playwright:global-setup] No PLAYWRIGHT_TEST_TOKEN or DASHBOARD_ACCESS_TOKEN set · spec will hit the gate at /login.',
    );
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';
  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  try {
    const response = await context.request.post(`${baseURL}/api/login`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok()) {
      throw new Error(`/api/login returned ${response.status()}`);
    }
    await context.storageState({ path: STATE_PATH });
  } finally {
    await context.close();
    await browser.close();
  }
}
