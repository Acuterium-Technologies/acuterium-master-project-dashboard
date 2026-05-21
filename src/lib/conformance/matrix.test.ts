/**
 * ACAI conformance matrix unit tests · Phase 3b.03.
 *
 * jsdom doesn't expose custom-property values via getComputedStyle, so the
 * matrix falls back to documentElement.style.getPropertyValue — we exercise
 * both branches here.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { computeStructuralConformance } from './matrix';

describe('computeStructuralConformance', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.body.className = '';
    document.body.innerHTML = '';
    try {
      window.localStorage.clear();
    } catch {
      /* jsdom localStorage may not exist */
    }
    delete (window as unknown as { __acai?: unknown }).__acai;
  });

  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.body.className = '';
    document.body.innerHTML = '';
  });

  it('returns 22 rows', () => {
    const r = computeStructuralConformance();
    expect(r.rows).toHaveLength(22);
  });

  it('score is in 0..100 range', () => {
    const r = computeStructuralConformance();
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('total weight is the sum of all row weights', () => {
    const r = computeStructuralConformance();
    const sum = r.rows.reduce((s, row) => s + row.weight, 0);
    expect(r.totalWeight).toBe(sum);
  });

  it('with nothing present → score is 0', () => {
    const r = computeStructuralConformance();
    // 22 rows · only "A KAIROS mode class active on body" can never be 0 from empty state;
    // here body has no mode class so it should be 0, and Compliance rows are pinned false.
    expect(r.earnedWeight).toBe(0);
    expect(r.score).toBe(0);
  });

  it('full structural environment → score in ~62-95% range (Compliance rows pin false)', () => {
    // Stub every observable signal
    document.documentElement.style.setProperty('--radius-lg', '22px');
    document.documentElement.style.setProperty('--breath-stressed', '2.8s');
    document.documentElement.style.setProperty('--breath-calm', '4.8s');
    document.documentElement.style.setProperty('--bg-gov', '#B8D4E8');
    document.documentElement.style.setProperty('--chronos-gradient', 'linear-gradient(...)');

    document.body.classList.add('mode-dashboard');

    // Inject all data-qa markers the matrix looks for
    const markers = [
      '[data-tuui-ripple-ready]',
      '[data-ambient-particles-ready]',
      '[data-qa="bi-grid"]',
      '[data-qa="telos-oracle"]',
      '[data-qa="face2feel-consent"]',
      '[data-qa="voice2feel-consent"]',
      '[data-qa="touch2feel-ready"]',
      '[data-qa="sentinel-light"]',
    ];
    for (const sel of markers) {
      const el = document.createElement('div');
      // Convert e.g. `[data-qa="bi-grid"]` to attribute name+value
      const m = sel.match(/^\[([^\]=]+)(?:="([^"]+)")?\]$/);
      if (m) {
        el.setAttribute(m[1], m[2] ?? '');
      }
      document.body.appendChild(el);
    }

    try {
      window.localStorage.setItem('acu-master-ops:mnemos:v1', '{}');
    } catch {
      /* ignore */
    }

    (window as unknown as { __acai: Record<string, unknown> }).__acai = {
      kairos: {},
      pathos: {},
      nexus: {},
      telos: {},
    };

    const r = computeStructuralConformance();
    // Compliance rows (15 weight) pin false, so score caps below 100.
    // We expect a high score (>= 85% of remaining weight).
    expect(r.score).toBeGreaterThan(80);
    expect(r.score).toBeLessThan(100);
  });

  it('Phase 3a-like baseline → score in expected range', () => {
    // Phase 3a-baseline: tokens landed + mode-aui + MNEMOS + #telos-panel
    document.documentElement.style.setProperty('--radius-lg', '22px');
    document.documentElement.style.setProperty('--breath-stressed', '2.8s');
    document.documentElement.style.setProperty('--breath-calm', '4.8s');
    document.documentElement.style.setProperty('--bg-gov', '#B8D4E8');
    document.body.classList.add('mode-aui');
    try {
      window.localStorage.setItem('acu-master-ops:mnemos:v1', '{}');
    } catch {
      /* ignore */
    }
    const telos = document.createElement('div');
    telos.id = 'telos-panel';
    document.body.appendChild(telos);

    const r = computeStructuralConformance();
    // 4 token rows + mode-class + GUI gov + MNEMOS + telos = 18 + 8 + 6 + 9 + 7 = 48
    // total = 148 → ~32%. This was the conservative pre-3b baseline.
    expect(r.earnedWeight).toBeGreaterThanOrEqual(40);
    expect(r.earnedWeight).toBeLessThanOrEqual(60);
  });
});
