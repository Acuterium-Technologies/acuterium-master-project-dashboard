/**
 * 7-emotion → 5-axis PATHOS mapping · Phase 3d-i.
 *
 * Coefficients sourced from the bundle's canonical reference
 * (specs/3d-i/reference/pathos-formula.ts):
 *   - Russell (1980) circumplex model of affect
 *   - Ekman (1992) basic emotions
 *   - Bartneck (2008) emotion → engagement mapping
 *
 * LOCKED for 3d-i. Live tuning panel arrives in Phase 3d-iv via
 * /api/dashboard/calibration. Do not adjust coefficients here without
 * operator sign-off.
 *
 * Axis order LOAD-BEARING: Stress · Focus · Curiosity · Fatigue · Satisfaction.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import type { EmotionVector, PathosDelta } from './face2feel-types';

const clamp = (v: number, lo = -1, hi = 1): number => Math.max(lo, Math.min(hi, v));

export function emotionToPathos(e: EmotionVector): PathosDelta {
  return {
    stress: clamp(
      0.7 * e.angry +
        0.6 * e.fearful +
        0.4 * e.disgusted -
        0.3 * e.happy,
    ),
    focus: clamp(
      0.5 * e.neutral +
        0.4 * e.happy -
        0.6 * e.sad -
        0.4 * e.fearful,
    ),
    curiosity: clamp(
      0.6 * e.surprised +
        0.3 * e.happy -
        0.4 * e.sad,
    ),
    fatigue: clamp(
      0.7 * e.sad +
        0.3 * (1 - e.happy) -
        0.5 * e.happy,
      // 30s neutral-drop derivative lands in 3d-iv
    ),
    satisfaction: clamp(
      0.8 * e.happy +
        0.2 * e.neutral -
        0.7 * e.angry -
        0.6 * e.sad,
    ),
  };
}
