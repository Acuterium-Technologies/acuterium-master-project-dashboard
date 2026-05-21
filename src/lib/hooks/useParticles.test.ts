/**
 * Particle density math · unit tests · Phase 3c.03.
 *
 * Pure-function coverage of computeParticleCount + MODE_DENSITY_MULTIPLIERS.
 * The DOM-side useParticles hook is exercised via the Playwright
 * living-interface.spec.ts (Ambient > 50, HUD < 50) which can run a real
 * canvas. Vitest stays node-env (no jsdom).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, it, expect } from 'vitest';

import {
  MODE_DENSITY_MULTIPLIERS,
  PARTICLE_DIVISOR,
  PARTICLE_HARD_CAP,
  computeParticleCount,
} from './useParticles';

const TYPICAL_W = 1440;
const TYPICAL_H = 900;
const BIG_W = 5000;
const BIG_H = 5000;

describe('MODE_DENSITY_MULTIPLIERS · ACAI V2 canon', () => {
  it('locks the 6 mode multipliers', () => {
    expect(MODE_DENSITY_MULTIPLIERS.aui).toBe(1.0);
    expect(MODE_DENSITY_MULTIPLIERS.ambient).toBe(3.0);
    expect(MODE_DENSITY_MULTIPLIERS.hud).toBe(0.3);
    expect(MODE_DENSITY_MULTIPLIERS.tuui).toBe(1.5);
    expect(MODE_DENSITY_MULTIPLIERS.gui).toBe(0.5);
    expect(MODE_DENSITY_MULTIPLIERS.dashboard).toBe(1.0);
  });
});

describe('computeParticleCount · per-mode density', () => {
  const base = Math.floor((TYPICAL_W * TYPICAL_H) / PARTICLE_DIVISOR);

  it('aui returns base count', () => {
    expect(computeParticleCount(TYPICAL_W, TYPICAL_H, 'aui')).toBe(base);
  });

  it('ambient returns ~3× base (capped at 200)', () => {
    const count = computeParticleCount(TYPICAL_W, TYPICAL_H, 'ambient');
    expect(count).toBe(Math.min(Math.floor(base * 3.0), PARTICLE_HARD_CAP));
  });

  it('hud returns ~0.3× base', () => {
    expect(computeParticleCount(TYPICAL_W, TYPICAL_H, 'hud')).toBe(Math.floor(base * 0.3));
  });

  it('tuui returns ~1.5× base', () => {
    expect(computeParticleCount(TYPICAL_W, TYPICAL_H, 'tuui')).toBe(Math.floor(base * 1.5));
  });

  it('gui returns ~0.5× base', () => {
    expect(computeParticleCount(TYPICAL_W, TYPICAL_H, 'gui')).toBe(Math.floor(base * 0.5));
  });

  it('dashboard returns base count', () => {
    expect(computeParticleCount(TYPICAL_W, TYPICAL_H, 'dashboard')).toBe(base);
  });
});

describe('computeParticleCount · 200 hard cap', () => {
  it('caps Ambient × 3 at 200 on a 5000 × 5000 canvas', () => {
    expect(computeParticleCount(BIG_W, BIG_H, 'ambient')).toBe(PARTICLE_HARD_CAP);
  });

  it('caps even AUI at 200 on a huge canvas', () => {
    // 5000 × 5000 / 24000 = 1041 → cap kicks in.
    expect(computeParticleCount(BIG_W, BIG_H, 'aui')).toBe(PARTICLE_HARD_CAP);
  });

  it('does NOT cap small canvases', () => {
    const small = computeParticleCount(400, 300, 'aui');
    expect(small).toBeLessThan(PARTICLE_HARD_CAP);
  });
});

describe('computeParticleCount · Playwright contract', () => {
  // The Playwright tests run at default viewport 1280 × 720.
  const PW_W = 1280;
  const PW_H = 720;
  const PW_BASE = Math.floor((PW_W * PW_H) / PARTICLE_DIVISOR);

  it('Ambient at 1280x720 > 50 (matches `Particles · Ambient mode increases density`)', () => {
    const count = computeParticleCount(PW_W, PW_H, 'ambient');
    expect(count).toBeGreaterThan(50);
    expect(count).toBe(Math.min(Math.floor(PW_BASE * 3), PARTICLE_HARD_CAP));
  });

  it('HUD at 1280x720 < 50 (matches `Particles · HUD mode decreases density`)', () => {
    const count = computeParticleCount(PW_W, PW_H, 'hud');
    expect(count).toBeLessThan(50);
  });
});
