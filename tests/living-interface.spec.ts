/**
 * tests/living-interface.spec.ts
 *
 * Playwright visual + behavior regression for Phase 3c (Living Interface).
 *
 * Covers:
 *   - CHRONOS GCC prayer-time gradients (mock clock at 6 boundaries + 2 locale paths)
 *   - TUUI ripple physics (touch + 48px enforcement + cursor:none)
 *   - Particle density variance per mode (visual sample at Ambient vs HUD)
 *   - Aurora hero stagger (cold load reveals 3 words · refresh does not)
 *   - F-13 cleanup · MOEMatrixFull activates at ?dashboard=moe
 *
 * Source of truth: specs/3c/{01,02,03,04,05}-*.md
 * Doctrinal alignment: D-08 visual extension, F-04 closure, F-13 closure
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import { test, expect } from '@playwright/test';

// ── CHRONOS GCC gradients (mock clock + locale) ──────────────────────────────

const CHRONOS_CASES = [
  { hour: 5,  locale: 'ar-OM', expectedPeriod: 'fajr',     expectedLabel: 'الفجر' },
  { hour: 9,  locale: 'ar-OM', expectedPeriod: 'duha',     expectedLabel: 'الضحى' },
  { hour: 13, locale: 'ar-OM', expectedPeriod: 'dhuhr',    expectedLabel: 'الظهر' },
  { hour: 15, locale: 'ar-OM', expectedPeriod: 'asr',      expectedLabel: 'العصر' },
  { hour: 18, locale: 'ar-OM', expectedPeriod: 'maghrib',  expectedLabel: 'المغرب' },
  { hour: 22, locale: 'ar-OM', expectedPeriod: 'isha',     expectedLabel: 'العشاء' },
  { hour: 9,  locale: 'en-US', expectedPeriod: 'morning',  expectedLabel: 'Morning' },
  { hour: 18, locale: 'en-US', expectedPeriod: 'sunset',   expectedLabel: 'Sunset' },
];

for (const c of CHRONOS_CASES) {
  test(`CHRONOS · ${c.locale} @ ${c.hour}:00 → ${c.expectedPeriod}`, async ({ page, context }) => {
    // Mock locale
    await context.addInitScript((locale: string) => {
      Object.defineProperty(navigator, 'language', { value: locale, writable: false });
      Object.defineProperty(navigator, 'languages', { value: [locale], writable: false });
    }, c.locale);

    // Mock clock — spec-vs-reality call-out: `ConstructorParameters<typeof Date>`
    // is `[]` (Date has overloaded constructors), so we accept `unknown[]` and
    // forward via the call signature to preserve all overloads at runtime.
    await context.addInitScript((hour: number) => {
      const RealDate = Date;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MockDate = function (this: Date | void, ...args: any[]): any {
        if (!(this instanceof MockDate)) return new RealDate().toString();
        if (args.length === 0) {
          const d = new RealDate();
          d.setHours(hour, 0, 0, 0);
          return d;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (RealDate as any)(...args);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      MockDate.prototype = RealDate.prototype;
      MockDate.now = () => {
        const d = new RealDate();
        d.setHours(hour, 0, 0, 0);
        return d.getTime();
      };
      MockDate.UTC = RealDate.UTC;
      MockDate.parse = RealDate.parse;
      (globalThis as { Date: typeof Date }).Date = MockDate as unknown as typeof Date;
    }, c.hour);

    await page.goto('/master-ops');
    await page.waitForTimeout(500);

    const period = await page.evaluate(() => document.documentElement.dataset.chronosPeriod);
    expect(period).toBe(c.expectedPeriod);

    const label = await page.locator('[data-qa="chronos-label"]').textContent();
    expect(label?.trim()).toContain(c.expectedLabel);
  });
}

// ── TUUI ripple physics ──────────────────────────────────────────────────────

test('TUUI · ripple appears on touch inside mode-tuui', async ({ page }) => {
  await page.goto('/master-ops');
  await page.keyboard.press('Alt+T');
  await page.waitForTimeout(300);

  // Find a button + simulate touch
  const button = page.locator('button').first();
  await button.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const touch = new Touch({
      identifier: 0,
      target: el,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
    const event = new TouchEvent('touchstart', {
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
      bubbles: true,
    });
    el.dispatchEvent(event);
  });

  // Ripple element should briefly exist
  const ripples = await page.locator('.tuui-ripple').count();
  expect(ripples).toBeGreaterThan(0);

  // After 700ms, ripple should be cleaned up
  await page.waitForTimeout(700);
  const ripplesAfter = await page.locator('.tuui-ripple').count();
  expect(ripplesAfter).toBe(0);
});

test('TUUI · 48px min touch target enforced', async ({ page }) => {
  await page.goto('/master-ops');
  await page.keyboard.press('Alt+T');
  await page.waitForTimeout(300);

  const button = page.locator('button').first();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
});

test('TUUI · cursor is none in mode-tuui', async ({ page }) => {
  await page.goto('/master-ops');
  await page.keyboard.press('Alt+T');
  await page.waitForTimeout(300);

  const cursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  expect(cursor).toBe('none');
});

// ── Particle density per mode ────────────────────────────────────────────────

test('Particles · Ambient mode increases density', async ({ page }) => {
  await page.goto('/master-ops');
  await page.keyboard.press('Alt+M');
  await page.waitForTimeout(500);

  const particleCount = await page.evaluate(() => {
    return (window as { __acai?: { particleNetwork?: { particles?: { length: number } } } }).__acai?.particleNetwork?.particles?.length ?? 0;
  });
  expect(particleCount).toBeGreaterThan(50);  // Ambient should have many particles
});

test('Particles · HUD mode decreases density', async ({ page }) => {
  await page.goto('/master-ops');
  await page.keyboard.press('Alt+H');
  await page.waitForTimeout(500);

  const particleCount = await page.evaluate(() => {
    return (window as { __acai?: { particleNetwork?: { particles?: { length: number } } } }).__acai?.particleNetwork?.particles?.length ?? 0;
  });
  expect(particleCount).toBeLessThan(50);  // HUD should have few particles
});

// ── Aurora hero stagger ──────────────────────────────────────────────────────

test('Aurora · cold load triggers 3-word stagger', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/master-ops');
  await page.waitForTimeout(200);

  const wordCount = await page.locator('.acu-hero-word').count();
  expect(wordCount).toBe(3);
});

test('Aurora · refresh does not re-trigger (sessionStorage guard)', async ({ page }) => {
  await page.goto('/master-ops');
  await page.waitForTimeout(200);
  // First load already revealed
  await page.reload();
  await page.waitForTimeout(200);

  const wordCount = await page.locator('.acu-hero-word').count();
  expect(wordCount).toBe(0);
});

test('Aurora · prefers-reduced-motion skips stagger', async ({ page, context }) => {
  await context.clearCookies();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/master-ops');
  await page.waitForTimeout(200);

  const wordCount = await page.locator('.acu-hero-word').count();
  expect(wordCount).toBe(0);
});

// ── F-13 cleanup · MOEMatrixFull ─────────────────────────────────────────────

test('F-13 · MOEMatrixFull activates at ?dashboard=moe', async ({ page }) => {
  await page.goto('/master-ops?dashboard=moe');
  await page.keyboard.press('Alt+D');
  await page.waitForTimeout(500);

  await expect(page.locator('[data-qa="moe-matrix-full"]')).toBeVisible();

  // Stats present
  await expect(page.locator('.acu-moe-full__stats')).toBeVisible();
});

test('F-13 · MOEMatrixFull hover shows tooltip', async ({ page }) => {
  await page.goto('/master-ops?dashboard=moe');
  await page.keyboard.press('Alt+D');
  await page.waitForTimeout(800); // wait for first SSE snapshot

  const canvas = page.locator('[data-qa="moe-matrix-full"] canvas');
  await canvas.hover({ position: { x: 100, y: 100 } });
  await page.waitForTimeout(100);

  const tooltip = page.locator('.acu-moe-full__tooltip');
  await expect(tooltip).toBeVisible();
  const text = await tooltip.textContent();
  expect(text).toContain('Expert #');
});
