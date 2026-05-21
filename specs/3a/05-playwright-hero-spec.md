# Spec 3a.05 · Playwright Hero Visual Regression

**Sub-phase:** 3a
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved · canonical test file already in bundle
**Estimated time:** 20 min (most work is CI wiring, not writing the test)

---

## Why

Closes **F-06** from the 2026-05-21 logo-fix audit. The component (`HeroBrandLockup.tsx`), the CSS (`hero-brand-lockup.css`), and the runtime guardrail (`heroBrandGuardrail.ts`) are all live on production. The **hardening layer** (Playwright visual regression spec) was specified in `repo-ready-implementation-logo-fix-1.md` lines 407-449 but never landed in the repo.

## Implementation

### File 1 · `tests/hero-brand.spec.ts`

**Source file in this bundle:** `tests/hero-brand.spec.ts` — copy verbatim to repo at `tests/hero-brand.spec.ts`. Creates the `tests/` directory at repo root.

5 viewports asserted: 1440 · 1024 · 768 · 430 · 390.
Each viewport asserts:
- Hero, logo frame, title all visible
- Logo bounding box height ≤ 120px desktop / 80px mobile
- Logo bounding box height < title height × 1.35 (logo must not visually dominate)
- Screenshot diff ≤ 2% (`maxDiffPixelRatio: 0.02`)

### File 2 · `package.json` updates

Add to `devDependencies`:
```json
"@playwright/test": "^1.49.0"
```

Add to `scripts`:
```json
"test:visual": "playwright test",
"test:visual:update": "playwright test --update-snapshots"
```

### File 3 · `playwright.config.ts` (NEW at repo root)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### File 4 · CI workflow update — `.github/workflows/ci.yml`

Add a new job (existing jobs untouched):

```yaml
visual-regression:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run build
    - run: npm run test:visual
      env:
        PLAYWRIGHT_BASE_URL: http://localhost:3000
        DASHBOARD_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_TEST_TOKEN }}
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

**Secret to add in GitHub repo settings:** `PLAYWRIGHT_TEST_TOKEN` — a separate test token that grants dashboard access for the CI runner. Operator must add this.

### File 5 · Generate initial screenshot baselines

After landing the spec, run locally once:
```bash
npm run test:visual:update
```

This produces 5 baseline PNG files in `tests/hero-brand.spec.ts-snapshots/` (or `tests/__screenshots__/`, Playwright's default). Commit these baselines alongside the spec.

## Doctrinal red-lines

- Spec MUST match `repo-ready-implementation-logo-fix-1.md` lines 407-449 verbatim (no drift)
- CI MUST run on every PR touching `src/components/brand/**`, `src/styles/hero-brand-lockup.css`, or any hero-rendering page
- Baseline PNGs MUST be committed (not gitignored) — they're the canonical reference
- Updating baselines (`--update-snapshots`) MUST be a deliberate operator action, never automated
- `PLAYWRIGHT_TEST_TOKEN` MUST be repo-scoped, not org-wide

## Acceptance criteria

- [ ] `tests/hero-brand.spec.ts` lives in repo (verbatim from bundle)
- [ ] `playwright.config.ts` at repo root
- [ ] `@playwright/test` in devDependencies
- [ ] `npm run test:visual` script exists and runs locally
- [ ] 5 baseline PNGs committed to `tests/hero-brand.spec.ts-snapshots/`
- [ ] CI workflow runs Playwright on every push touching brand surface
- [ ] `PLAYWRIGHT_TEST_TOKEN` secret documented in `DEPLOYMENT-GUIDE.md`
- [ ] Bundle delta unaffected (Playwright is devDep only)
