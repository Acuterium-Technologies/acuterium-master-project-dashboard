/**
 * Canonical TypeScript reference · 7-emotion → 5-axis PATHOS mapping
 *
 * Source coefficients:
 * - Russell, J. A. (1980) · "A circumplex model of affect" · Journal of Personality and Social Psychology
 * - Ekman, P. (1992) · "Are there basic emotions?" · Psychological Review
 * - Bartneck, C. (2008) · "Robotic User Interfaces" · proceedings of HCI
 *
 * These are STARTING values for Phase 3d-i.
 * Live tuning panel (admin UI) arrives in Phase 3d-iv.
 *
 * LOCKED for 3d-i · tunable from 3d-iv via /api/dashboard/calibration endpoint.
 */

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
  stress: number;
  focus: number;
  curiosity: number;
  fatigue: number;
  satisfaction: number;
}

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

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
      0.3 * (1 - e.happy) -
      0.5 * e.happy
    ),
    satisfaction: clamp(
      0.8 * e.happy +
      0.2 * e.neutral -
      0.7 * e.angry -
      0.6 * e.sad
    ),
  };
}

// EMA smoothing · alpha 0.3 · LOCKED for 3d-i
export function emaSmooth(current: PathosDelta, previous: PathosDelta | null, alpha = 0.3): PathosDelta {
  if (!previous) return current;
  return {
    stress:       alpha * current.stress       + (1 - alpha) * previous.stress,
    focus:        alpha * current.focus        + (1 - alpha) * previous.focus,
    curiosity:    alpha * current.curiosity    + (1 - alpha) * previous.curiosity,
    fatigue:      alpha * current.fatigue      + (1 - alpha) * previous.fatigue,
    satisfaction: alpha * current.satisfaction + (1 - alpha) * previous.satisfaction,
  };
}
