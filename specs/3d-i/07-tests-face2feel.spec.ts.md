# 3d-i · Sub-spec 07 · Tests

**Time:** 20 min · **Depends on:** 01-06
**Targets:** ~22 new tests · brings total from 91 (3c) → ~113 (3d-i)

---

## Playwright Suite

```typescript
// tests/face2feel.spec.ts

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const TOKEN = process.env.DASHBOARD_ACCESS_TOKEN;

async function authenticate(page: Page) {
  if (!TOKEN) throw new Error('DASHBOARD_ACCESS_TOKEN required');
  await page.context().addCookies([{
    name: 'acuterium-access',  // LOCKED · F-08
    value: TOKEN,
    domain: new URL(BASE_URL).hostname,
    path: '/',
  }]);
}

test.describe('Face2Feel · Consent System', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('default tier is off · no camera permission requested', async ({ page }) => {
    let permissionRequested = false;
    await page.context().grantPermissions([]);
    page.on('request', req => {
      if (req.url().includes('getUserMedia')) permissionRequested = true;
    });
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await expect(page.getByRole('radio', { name: /Off/i, checked: true })).toBeVisible();
    expect(permissionRequested).toBe(false);
  });

  test('session-only consent · grants permission · clears on tab close', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /This session only/i }).click();
    
    // sessionStorage entry present
    const sess = await page.evaluate(() => sessionStorage.getItem('acu-master-ops:consent:v1:face2feel'));
    expect(sess).toContain('"tier":"session"');
    
    // localStorage entry NOT present
    const local = await page.evaluate(() => localStorage.getItem('acu-master-ops:consent:v1'));
    expect(local ?? '{}').not.toContain('face2feel');
  });

  test('persistent consent · localStorage entry present · survives reload', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    
    await page.reload();
    await expect(page.getByRole('radio', { name: /Always enable/i, checked: true })).toBeVisible();
  });

  test('revoke · clears both storage entries · stops MediaStream', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    
    // Wait for stream to be active
    await expect(page.getByTestId('sentinel-face2feel')).toBeVisible();
    
    await page.getByRole('button', { name: /Revoke now/i }).click();
    
    await expect(page.getByTestId('sentinel-face2feel')).toHaveCount(0);
    const local = await page.evaluate(() => localStorage.getItem('acu-master-ops:consent:v1') ?? '{}');
    expect(local).not.toContain('face2feel');
  });
});

test.describe('Face2Feel · Sentinel Dot', () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticate(page);
    await context.grantPermissions(['camera']);
  });

  test('hidden when consent off', async ({ page }) => {
    await page.goto(`${BASE_URL}/master-ops`);
    await expect(page.getByTestId('sentinel-face2feel')).toHaveCount(0);
  });

  test('visible when consent on · red color · pulsing animation', async ({ page }) => {
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.goto(`${BASE_URL}/master-ops`);
    
    const dot = page.getByTestId('sentinel-face2feel');
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('data-state', 'active');
    
    const ringColor = await dot.locator('span').nth(1).evaluate(el =>
      getComputedStyle(el).borderColor
    );
    expect(ringColor).toBe('rgb(239, 68, 68)');  // #ef4444 red
  });

  test('z-index above modals', async ({ page }) => {
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.goto(`${BASE_URL}/master-ops`);
    
    const dotZ = await page.getByTestId('sentinel-face2feel').evaluate(el =>
      parseInt(getComputedStyle(el).zIndex, 10)
    );
    expect(dotZ).toBeGreaterThanOrEqual(99999);
  });

  test('pulse animation respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.goto(`${BASE_URL}/master-ops`);
    
    const animation = await page.getByTestId('sentinel-face2feel').locator('span').nth(1).evaluate(el =>
      getComputedStyle(el).animationName
    );
    expect(animation).toBe('none');
  });
});

test.describe('Face2Feel · Models', () => {
  test.beforeEach(async ({ page }) => await authenticate(page));

  test('models fetched from same origin · no third-party CDN', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    const thirdPartyRequests: string[] = [];
    page.on('request', req => {
      const url = new URL(req.url());
      if (!url.hostname.includes(new URL(BASE_URL).hostname) && url.pathname.includes('model')) {
        thirdPartyRequests.push(req.url());
      }
    });
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.waitForTimeout(3000);
    expect(thirdPartyRequests).toEqual([]);
  });

  test('models cached by service worker on second visit', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.waitForTimeout(2000);
    
    const swCached: string[] = [];
    page.on('response', res => {
      if (res.fromServiceWorker() && res.url().includes('/models/face2feel/')) {
        swCached.push(res.url());
      }
    });
    await page.reload();
    await page.waitForTimeout(2000);
    expect(swCached.length).toBeGreaterThan(0);
  });
});

test.describe('Face2Feel · GDPR Disclosure', () => {
  test('biometric disclosure page renders · WCAG AA contrast', async ({ page }) => {
    await page.goto(`${BASE_URL}/legal/biometric`);
    await expect(page.getByRole('heading', { name: /Biometric Data Processing Disclosure/i })).toBeVisible();
    await expect(page.getByText(/Article 9.*GDPR/i)).toBeVisible();
  });
});

test.describe('Face2Feel · Visibility', () => {
  test('tab backgrounded → sentinel dot turns amber', async ({ page, context }) => {
    await authenticate(page);
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.goto(`${BASE_URL}/master-ops`);
    
    await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { value: 'hidden' }));
    document.dispatchEvent(new Event('visibilitychange'));
    
    const dot = page.getByTestId('sentinel-face2feel');
    await expect(dot).toHaveAttribute('data-state', 'paused');
  });
});

test.describe('Face2Feel · window.__acai exposure', () => {
  test('window.__acai.face2feel object present when consent on', async ({ page, context }) => {
    await authenticate(page);
    await context.grantPermissions(['camera']);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByRole('radio', { name: /Always enable/i }).click();
    await page.goto(`${BASE_URL}/master-ops`);
    
    const has = await page.evaluate(() => typeof (window as any).__acai?.face2feel === 'object');
    expect(has).toBe(true);
  });

  test('conformance probe reports face2feel-engine present', async ({ page }) => {
    await authenticate(page);
    const res = await page.request.get(`${BASE_URL}/api/dashboard/conformance`);
    const json = await res.json();
    expect(json.probes.some((p: any) => p.id === 'face2feel-engine')).toBe(true);
  });
});
```

---

## Vitest Suite (already drafted in spec 05)

`tests/unit/pathos-mapping.test.ts` — 8 cases · runs <500ms · zero browser dependency.

---

## Test Count Roll-up

| Category | Count |
|---|---|
| Consent system Playwright | 4 |
| Sentinel dot Playwright | 4 |
| Models Playwright | 2 |
| GDPR disclosure Playwright | 1 |
| Visibility Playwright | 1 |
| `window.__acai` Playwright | 2 |
| PATHOS mapping Vitest | 8 |
| **Subtotal new** | **22** |
| Phase 3c baseline | 91 |
| **GRAND TOTAL** | **113** |

---

## Vitest Config Update Required

```typescript
// vitest.config.ts (MODIFIED · F-12 carve-out)

export default defineConfig({
  test: {
    include: [
      // ... existing patterns
      'src/lib/biometrics/**/*.test.ts',   // NEW
      'tests/unit/pathos-*.test.ts',       // NEW
    ],
  },
});
```

---

## Acceptance

1. All 22 new tests pass
2. Baseline 91 tests still pass
3. Test runtime: Playwright suite <90s · Vitest suite <2s
4. No flaky tests after 3 consecutive runs
5. Visual regression baselines NOT required for 3d-i (defer to F-2 follow-up)
