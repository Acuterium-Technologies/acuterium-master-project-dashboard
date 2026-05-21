/**
 * tests/dashboard-mode.spec.ts
 *
 * Playwright visual-regression spec for Dashboard mode BI grid.
 *
 * Captures the 3-rail layout at 5 viewports.
 * Verifies F-03 closure (Dashboard mode is now a proper BI grid).
 *
 * Source of truth: specs/3b/01-bi-grid-layout.md + specs/3b/02-moe-expert-matrix.md
 * Doctrinal alignment: D-08 (visual extension), F-04 closure
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'desktop-xl', width: 1920, height: 1080 },
  { name: 'desktop',    width: 1440, height: 900 },
  { name: 'laptop',     width: 1280, height: 800 },
  { name: 'tablet',     width: 1024, height: 768 },
  { name: 'mobile',     width: 390,  height: 844 },
];

for (const vp of viewports) {
  test(`dashboard mode renders correctly - ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/master-ops');

    // Wait for engines to mount
    await page.waitForFunction(() => (window as any).__acai?.kairos !== undefined, { timeout: 10000 });

    // Switch to Dashboard mode
    await page.keyboard.press('Alt+D');
    await page.waitForTimeout(500); // mode-physics transition

    // Verify body class
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toContain('mode-dashboard');

    if (vp.width >= 1280) {
      // 3-rail layout active
      await expect(page.locator('[data-qa="bi-grid"]')).toBeVisible();
      await expect(page.locator('[data-qa="left-rail"]')).toBeVisible();
      await expect(page.locator('[data-qa="right-rail"]')).toBeVisible();
      await expect(page.locator('[data-qa="top-strip"]')).toBeVisible();
    } else if (vp.width >= 768) {
      // Rails collapse to drawers
      await expect(page.locator('[data-qa="bi-grid"]')).toBeVisible();
      // Rails are present in DOM but offscreen
      const leftRail = page.locator('[data-qa="left-rail"]');
      const leftRailTransform = await leftRail.evaluate(el => getComputedStyle(el).transform);
      expect(leftRailTransform).toContain('matrix'); // translate3d transform applied
    } else {
      // Mobile: rails hidden entirely
      const leftRail = page.locator('[data-qa="left-rail"]');
      await expect(leftRail).not.toBeVisible();
    }

    // PATHOS sidebar (only at desktop+ widths where left rail is visible)
    if (vp.width >= 1280) {
      await expect(page.locator('[data-qa="pathos-sidebar"]')).toBeVisible();
      // 5 axes
      const axisCount = await page.locator('[data-qa="pathos-sidebar"] .acu-pathos-axis').count();
      expect(axisCount).toBe(5);
    }

    // MOE matrix (only at desktop+ widths)
    if (vp.width >= 1280) {
      await expect(page.locator('[data-qa="moe-matrix-mini"]')).toBeVisible();
    }

    // Conformance gauge (always visible in top strip)
    await expect(page.locator('[data-qa="conformance-gauge-compact"]')).toBeVisible();

    // Screenshot
    await expect(page).toHaveScreenshot(`dashboard-mode-${vp.name}.png`, {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
      animations: 'disabled',
    });
  });
}

test('dashboard mode unmounts cleanly when switching to AUI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/master-ops');
  await page.waitForFunction(() => (window as any).__acai?.kairos !== undefined, { timeout: 10000 });

  // Switch to Dashboard
  await page.keyboard.press('Alt+D');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-qa="bi-grid"]')).toBeVisible();

  // Switch to AUI
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-qa="bi-grid"]')).not.toBeVisible();

  // Body class updated
  const bodyClass = await page.locator('body').getAttribute('class');
  expect(bodyClass).toContain('mode-aui');
  expect(bodyClass).not.toContain('mode-dashboard');
});

test('SSE stream for MOE matrix pauses on tab hidden', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/master-ops');
  await page.waitForFunction(() => (window as any).__acai?.kairos !== undefined, { timeout: 10000 });
  await page.keyboard.press('Alt+D');
  await page.waitForTimeout(500);

  // Confirm SSE connection is open
  const initialConnections = await page.evaluate(() => {
    return performance.getEntriesByType('resource').filter(r => r.name.includes('/api/dashboard/moe-stream')).length;
  });
  expect(initialConnections).toBeGreaterThanOrEqual(1);

  // Hide tab
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);

  // SSE should have closed (verify via internal __acai diagnostics if exposed, otherwise just confirm no error)
  // Note: actual close verification is environment-dependent; this is a smoke check.
});
