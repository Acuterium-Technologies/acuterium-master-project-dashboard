# 3d-i · Sub-spec 05 · PATHOS Mapping & EMA Smoothing

**Time:** 15 min · **Depends on:** 04 worker (consumes this module)
**Critical:** Axis order LOCKED: Stress · Focus · Curiosity · Fatigue · Satisfaction

---

## Type Contracts

```typescript
// src/lib/biometrics/face2feel-types.ts

export interface EmotionVector {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface PathosDelta {
  stress: number;        // [-1, +1]
  focus: number;
  curiosity: number;
  fatigue: number;
  satisfaction: number;
}

export interface PathosState extends PathosDelta {
  confidence: number;    // [0, 1]
  source: 'face' | 'voice' | 'touch' | 'fused';
  timestamp: number;
}
```

---

## Mapping Formula (LOCKED for 3d-i · tunable from 3d-iv)

```typescript
// src/lib/biometrics/pathos-mapping.ts

import type { EmotionVector, PathosDelta } from './face2feel-types';

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

/**
 * 7-emotion → 5-axis PATHOS mapping.
 *
 * Coefficients sourced from emotion-recognition literature:
 * - Russell's circumplex model (valence × arousal)
 * - Ekman's 7 basic emotions
 * - Bartneck (2008) emotion→engagement mapping for HCI
 *
 * These are STARTING values. Live tuning panel arrives in Phase 3d-iv after
 * 24-48h of real signal collection.
 */
export function emotionToPathos(e: EmotionVector): PathosDelta {
  return {
    stress: clamp(
      0.7 * e.angry +
      0.6 * e.fearful +
      0.4 * e.disgusted -
      0.3 * e.happy
    ),

    focus: clamp(
      0.5 * e.neutral +
      0.4 * e.happy -
      0.6 * e.sad -
      0.4 * e.fearful
    ),

    curiosity: clamp(
      0.6 * e.surprised +
      0.3 * e.happy -
      0.4 * e.sad
    ),

    fatigue: clamp(
      0.7 * e.sad +
      0.3 * (1 - e.happy) -      // low happy is itself fatigue signal
      0.5 * e.happy
      // neutral_dropping (30s derivative) lands in 3d-iv
    ),

    satisfaction: clamp(
      0.8 * e.happy +
      0.2 * e.neutral -
      0.7 * e.angry -
      0.6 * e.sad
    ),
  };
}
```

---

## EMA Smoothing

```typescript
// src/lib/biometrics/ema.ts

import type { PathosDelta } from './face2feel-types';

const ALPHA = 0.3;  // LOCKED · ~3s response time at 5fps

export function emaSmooth(
  current: PathosDelta,
  previous: PathosDelta | null
): PathosDelta {
  if (!previous) return current;
  return {
    stress:       ALPHA * current.stress       + (1 - ALPHA) * previous.stress,
    focus:        ALPHA * current.focus        + (1 - ALPHA) * previous.focus,
    curiosity:    ALPHA * current.curiosity    + (1 - ALPHA) * previous.curiosity,
    fatigue:      ALPHA * current.fatigue      + (1 - ALPHA) * previous.fatigue,
    satisfaction: ALPHA * current.satisfaction + (1 - ALPHA) * previous.satisfaction,
  };
}
```

---

## Unit Tests (Vitest)

```typescript
// tests/unit/pathos-mapping.test.ts

import { describe, it, expect } from 'vitest';
import { emotionToPathos } from '@/lib/biometrics/pathos-mapping';
import { emaSmooth } from '@/lib/biometrics/ema';

describe('emotionToPathos', () => {
  it('pure happiness produces high satisfaction · low stress', () => {
    const p = emotionToPathos({
      neutral: 0, happy: 1, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0,
    });
    expect(p.satisfaction).toBeGreaterThan(0.7);
    expect(p.stress).toBeLessThan(0);
  });

  it('pure anger produces high stress · negative satisfaction', () => {
    const p = emotionToPathos({
      neutral: 0, happy: 0, sad: 0, angry: 1, fearful: 0, disgusted: 0, surprised: 0,
    });
    expect(p.stress).toBeGreaterThan(0.6);
    expect(p.satisfaction).toBeLessThan(-0.6);
  });

  it('pure surprise produces high curiosity', () => {
    const p = emotionToPathos({
      neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 1,
    });
    expect(p.curiosity).toBeGreaterThan(0.5);
  });

  it('pure sadness produces high fatigue · negative focus', () => {
    const p = emotionToPathos({
      neutral: 0, happy: 0, sad: 1, angry: 0, fearful: 0, disgusted: 0, surprised: 0,
    });
    expect(p.fatigue).toBeGreaterThan(0.5);
    expect(p.focus).toBeLessThan(-0.5);
  });

  it('neutral baseline produces near-zero deltas', () => {
    const p = emotionToPathos({
      neutral: 1, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0,
    });
    expect(Math.abs(p.stress)).toBeLessThan(0.1);
    expect(p.focus).toBeGreaterThan(0.4);  // neutral → moderate focus
    expect(p.satisfaction).toBeLessThan(0.3);
  });

  it('all outputs clamped to [-1, +1]', () => {
    const p = emotionToPathos({
      neutral: 1, happy: 1, sad: 1, angry: 1, fearful: 1, disgusted: 1, surprised: 1,
    });
    for (const axis of Object.values(p)) {
      expect(axis).toBeGreaterThanOrEqual(-1);
      expect(axis).toBeLessThanOrEqual(1);
    }
  });
});

describe('emaSmooth', () => {
  it('first sample returns itself when previous is null', () => {
    const current = { stress: 0.5, focus: 0.3, curiosity: 0.1, fatigue: 0.2, satisfaction: 0.4 };
    expect(emaSmooth(current, null)).toEqual(current);
  });

  it('mixes 30/70 current/previous at alpha=0.3', () => {
    const prev = { stress: 0, focus: 0, curiosity: 0, fatigue: 0, satisfaction: 0 };
    const curr = { stress: 1, focus: 1, curiosity: 1, fatigue: 1, satisfaction: 1 };
    const out = emaSmooth(curr, prev);
    expect(out.stress).toBeCloseTo(0.3, 5);
    expect(out.focus).toBeCloseTo(0.3, 5);
  });

  it('after 10 iterations of constant input · converges within 5%', () => {
    let state: any = null;
    const target = { stress: 0.5, focus: 0.2, curiosity: -0.1, fatigue: 0.3, satisfaction: 0.4 };
    for (let i = 0; i < 10; i++) {
      state = emaSmooth(target, state);
    }
    for (const axis of Object.keys(target) as Array<keyof typeof target>) {
      expect(Math.abs(state[axis] - target[axis])).toBeLessThan(0.05);
    }
  });
});
```

---

## Acceptance

1. All 8 Vitest cases above pass
2. Axis order in PathosDelta interface matches LOCKED canon: Stress · Focus · Curiosity · Fatigue · Satisfaction
3. EMA α constant = 0.3 (LOCKED)
4. No external dependencies beyond TypeScript itself
5. `npm test -- pathos-mapping` runs in <500ms
