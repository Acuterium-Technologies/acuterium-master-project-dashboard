/**
 * Face2Feel · pathos-mapping + EMA · unit tests · Phase 3d-i.
 *
 * Pure-function coverage of emotionToPathos + emaSmooth.
 * Vitest in node env (no jsdom needed).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, it, expect } from 'vitest';

import { emotionToPathos } from '../../src/lib/biometrics/pathos-mapping';
import { emaSmooth, EMA_ALPHA } from '../../src/lib/biometrics/ema';
import type { PathosDelta } from '../../src/lib/biometrics/face2feel-types';

const ZERO_EMOTION = {
  neutral: 0,
  happy: 0,
  sad: 0,
  angry: 0,
  fearful: 0,
  disgusted: 0,
  surprised: 0,
};

describe('emotionToPathos', () => {
  it('pure happiness → high satisfaction · low stress', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, happy: 1 });
    expect(p.satisfaction).toBeGreaterThan(0.7);
    expect(p.stress).toBeLessThan(0);
  });

  it('pure anger → high stress · negative satisfaction', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, angry: 1 });
    expect(p.stress).toBeGreaterThan(0.6);
    expect(p.satisfaction).toBeLessThan(-0.6);
  });

  it('pure surprise → high curiosity', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, surprised: 1 });
    expect(p.curiosity).toBeGreaterThan(0.5);
  });

  it('pure sadness → high fatigue · negative focus', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, sad: 1 });
    expect(p.fatigue).toBeGreaterThan(0.5);
    expect(p.focus).toBeLessThan(-0.5);
  });

  it('neutral baseline → small stress · moderate focus · low satisfaction', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, neutral: 1 });
    expect(Math.abs(p.stress)).toBeLessThan(0.1);
    expect(p.focus).toBeGreaterThan(0.4);
    expect(p.satisfaction).toBeLessThan(0.3);
  });

  it('all outputs clamped to [-1, +1]', () => {
    const p = emotionToPathos({
      neutral: 1,
      happy: 1,
      sad: 1,
      angry: 1,
      fearful: 1,
      disgusted: 1,
      surprised: 1,
    });
    for (const axis of Object.values(p)) {
      expect(axis).toBeGreaterThanOrEqual(-1);
      expect(axis).toBeLessThanOrEqual(1);
    }
  });

  it('axis order matches PATHOS canon · destructuring 5 keys in order', () => {
    const p = emotionToPathos({ ...ZERO_EMOTION, happy: 0.5 });
    const keys = Object.keys(p);
    expect(keys).toEqual([
      'stress',
      'focus',
      'curiosity',
      'fatigue',
      'satisfaction',
    ]);
  });
});

describe('emaSmooth', () => {
  it('first sample returns itself when previous is null', () => {
    const current: PathosDelta = {
      stress: 0.5,
      focus: 0.3,
      curiosity: 0.1,
      fatigue: 0.2,
      satisfaction: 0.4,
    };
    expect(emaSmooth(current, null)).toEqual(current);
  });

  it('mixes 30/70 current/previous at α=0.3', () => {
    const prev: PathosDelta = {
      stress: 0,
      focus: 0,
      curiosity: 0,
      fatigue: 0,
      satisfaction: 0,
    };
    const curr: PathosDelta = {
      stress: 1,
      focus: 1,
      curiosity: 1,
      fatigue: 1,
      satisfaction: 1,
    };
    const out = emaSmooth(curr, prev);
    expect(out.stress).toBeCloseTo(EMA_ALPHA, 5);
    expect(out.focus).toBeCloseTo(EMA_ALPHA, 5);
    expect(out.curiosity).toBeCloseTo(EMA_ALPHA, 5);
    expect(out.fatigue).toBeCloseTo(EMA_ALPHA, 5);
    expect(out.satisfaction).toBeCloseTo(EMA_ALPHA, 5);
  });

  it('after 10 iterations of constant input · converges within 5%', () => {
    let state: PathosDelta | null = null;
    const target: PathosDelta = {
      stress: 0.5,
      focus: 0.2,
      curiosity: -0.1,
      fatigue: 0.3,
      satisfaction: 0.4,
    };
    for (let i = 0; i < 10; i++) {
      state = emaSmooth(target, state);
    }
    for (const axis of Object.keys(target) as Array<keyof PathosDelta>) {
      expect(Math.abs(state![axis] - target[axis])).toBeLessThan(0.05);
    }
  });

  it('EMA_ALPHA constant is locked at 0.3', () => {
    expect(EMA_ALPHA).toBe(0.3);
  });
});
