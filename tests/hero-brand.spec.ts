/**
 * tests/hero-brand.spec.ts
 *
 * Playwright visual-regression spec for the Acuterium hero lockup.
 *
 * Closes F-06 from the 2026-05-21 logo-fix audit:
 *   The Playwright hardening layer was specified in
 *   repo-ready-implementation-logo-fix-1.md (lines 407-449) but never landed.
 *
 * Source of truth: repo-ready-implementation-logo-fix-1.md
 * Doctrinal alignment: D-08 (visual extension), D-11 (L5 output discipline)
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'desktop',   width: 1440, height: 1200 },
  { name: 'laptop',    width: 1024, height: 1100 },
  { name: 'tablet',    width: 768,  height: 1024 },
  { name: 'mobile-lg', width: 430,  height: 932 },
  { name: 'mobile',    width: 390,  height: 844 },
];

for (const vp of viewports) {
  test(`hero logo remains proportional - ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    const hero  = page.locator('[data-qa="hero-lockup"]');
    const logo  = page.locator('[data-qa="hero-logo-frame"]');
    const title = page.locator('[data-qa="hero-title"]');

    await expect(hero).toBeVisible();
    await expect(logo).toBeVisible();
    await expect(title).toBeVisible();

    const logoBox  = await logo.boundingBox();
    const titleBox = await title.boundingBox();

    expect(logoBox).not.toBeNull();
    expect(titleBox).not.toBeNull();

    if (logoBox && titleBox) {
      // Mobile (<=640px) caps at 80px; desktop caps at 120px
      const maxLogoSize = vp.width <= 640 ? 80 : 120;
      expect(logoBox.height).toBeLessThanOrEqual(maxLogoSize);
      expect(logoBox.width).toBeLessThanOrEqual(maxLogoSize);

      // Logo MUST NOT visually dominate the title (height ratio < 1.35x)
      expect(logoBox.height).toBeLessThan(titleBox.height * 1.35);
    }

    await expect(hero).toHaveScreenshot(`hero-lockup-${vp.name}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
}
