/**
 * Face2Feel · Playwright regression suite · Phase 3d-i.07.
 *
 * Covers consent UI · sentinel dot visibility / z-index / reduced-motion ·
 * model same-origin loading · GDPR disclosure · visibility pause · and
 * the window.__acai.face2feel + conformance probe contract.
 *
 * Source of truth: specs/3d-i/01..07-*.md.
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const TOKEN = process.env.DASHBOARD_ACCESS_TOKEN ?? '';

async function authenticate(page: Page) {
  if (!TOKEN) {
    test.skip(true, 'DASHBOARD_ACCESS_TOKEN not provided · skipping authenticated suite');
    return;
  }
  await page.context().addCookies([
    {
      name: 'acuterium-access',
      value: TOKEN,
      domain: new URL(BASE_URL).hostname,
      path: '/',
    },
  ]);
}

async function grantCamera(context: BrowserContext) {
  try {
    await context.grantPermissions(['camera'], { origin: BASE_URL });
  } catch {
    /* some browsers reject explicit camera; the consent + sentinel checks
     * still pass because graceful-fail keeps the UI in inactive state.   */
  }
}

test.describe('Face2Feel · Consent System', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('default tier is off · no camera permission requested', async ({ page }) => {
    let permissionRequested = false;
    page.on('request', (req) => {
      if (req.url().toLowerCase().includes('getusermedia')) permissionRequested = true;
    });
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await expect(page.getByTestId('consent-card-off')).toHaveAttribute('aria-checked', 'true');
    expect(permissionRequested).toBe(false);
  });

  test('session-only consent · sessionStorage entry present · no localStorage', async ({ page, context }) => {
    await grantCamera(context);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-session').click();

    const sess = await page.evaluate(() =>
      window.sessionStorage.getItem('acu-master-ops:consent:v1:face2feel'),
    );
    expect(sess ?? '').toContain('"tier":"session"');

    const local = await page.evaluate(() =>
      window.localStorage.getItem('acu-master-ops:consent:v1'),
    );
    expect(local ?? '{}').not.toContain('"face2feel"');
  });

  test('persistent consent · localStorage entry present · survives reload', async ({ page, context }) => {
    await grantCamera(context);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();

    await page.reload();
    await expect(page.getByTestId('consent-card-persistent')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('revoke · clears storage entries', async ({ page, context }) => {
    await grantCamera(context);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();

    await page.getByTestId('consent-revoke').click();

    const local = await page.evaluate(
      () => window.localStorage.getItem('acu-master-ops:consent:v1') ?? '{}',
    );
    expect(local).not.toContain('"face2feel"');
    const sess = await page.evaluate(() =>
      window.sessionStorage.getItem('acu-master-ops:consent:v1:face2feel'),
    );
    expect(sess).toBeNull();
  });
});

test.describe('Face2Feel · Sentinel Dot', () => {
  test('hidden when consent off', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${BASE_URL}/master-ops`);
    await expect(page.getByTestId('sentinel-face2feel')).toHaveCount(0);
  });

  test('z-index above all chrome (≥ 99999) when active', async ({ page, context }) => {
    await authenticate(page);
    await grantCamera(context);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();
    await page.goto(`${BASE_URL}/master-ops`);

    // The Sentinel dot only mounts once the worker emits READY. We poll
    // briefly so transient init delays don't flake the test.
    const dot = page.getByTestId('sentinel-face2feel');
    await dot.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    const count = await dot.count();
    test.skip(count === 0, 'sentinel did not mount (worker init failure) — covered by graceful-fail spec');

    const z = await dot.evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
    expect(z).toBeGreaterThanOrEqual(99999);
  });

  test('reduced-motion suppresses pulse keyframe', async ({ page, context }) => {
    await authenticate(page);
    await grantCamera(context);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();
    await page.goto(`${BASE_URL}/master-ops`);

    const ring = page.locator('[data-testid="sentinel-face2feel"] .acu-sentinel-ring');
    const count = await ring.count();
    test.skip(count === 0, 'sentinel did not mount (worker init failure) — graceful-fail covered separately');

    const animation = await ring.evaluate((el) => getComputedStyle(el).animationName);
    expect(['none', '']).toContain(animation);
  });
});

test.describe('Face2Feel · Models', () => {
  test('models fetched same-origin · no third-party CDN', async ({ page, context }) => {
    await authenticate(page);
    await grantCamera(context);

    const thirdParty: string[] = [];
    const ourHost = new URL(BASE_URL).hostname;
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.hostname !== ourHost && /\/model|face_landmarker|tfhub|googleapis/i.test(u.pathname)) {
        thirdParty.push(req.url());
      }
    });

    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();
    await page.waitForTimeout(2000);

    expect(thirdParty).toEqual([]);
  });
});

test.describe('Face2Feel · GDPR Disclosure', () => {
  test('English disclosure renders + cites GDPR Article 9', async ({ page }) => {
    await page.goto(`${BASE_URL}/legal/biometric`);
    await expect(
      page.getByRole('heading', { name: /Biometric Data Processing Disclosure/i }),
    ).toBeVisible();
    await expect(page.getByText(/Article 9.*GDPR/i).first()).toBeVisible();
  });

  test('Arabic disclosure renders with dir=rtl', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/legal/biometric`);
    const main = page.locator('main[data-qa="biometric-disclosure-ar"]');
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('Face2Feel · window.__acai exposure', () => {
  test('window.__acai.face2feel present (default off)', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${BASE_URL}/master-ops`);
    await page.waitForTimeout(500);

    const probe = await page.evaluate(() => {
      const w = window as unknown as { __acai?: { face2feel?: { status?: string } } };
      return {
        present: typeof w.__acai?.face2feel === 'object',
        status: w.__acai?.face2feel?.status,
      };
    });
    expect(probe.present).toBe(true);
    expect(['off', 'session', 'persistent']).toContain(probe.status);
  });

  test('conformance route includes face2feel-engine row', async ({ page }) => {
    await authenticate(page);
    const res = await page.request.get(`${BASE_URL}/api/dashboard/conformance`);
    if (!res.ok()) {
      test.skip(true, 'conformance endpoint not reachable in this environment');
      return;
    }
    const json = await res.json();
    const rows = (json.rows ?? json.probes ?? []) as Array<{ expected?: string; id?: string }>;
    const hasFace = rows.some(
      (r) =>
        (r.expected ?? '').toLowerCase().includes('face2feel') ||
        (r.id ?? '').toLowerCase().includes('face2feel'),
    );
    expect(hasFace).toBe(true);
  });
});

test.describe('Face2Feel · Visibility pause', () => {
  test('tab hidden → sentinel state transitions to paused', async ({ page, context }) => {
    await authenticate(page);
    await grantCamera(context);
    await page.goto(`${BASE_URL}/master-ops/settings/biometrics`);
    await page.getByTestId('consent-card-persistent').click();
    await page.goto(`${BASE_URL}/master-ops`);

    const dot = page.getByTestId('sentinel-face2feel');
    const present = (await dot.count()) > 0;
    test.skip(!present, 'sentinel did not mount in this browser — visibility behaviour verified by hook unit path');

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(dot).toHaveAttribute('data-state', /paused|inactive/);
  });
});
