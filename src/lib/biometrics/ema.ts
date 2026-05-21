/**
 * EMA smoothing for the biometric PathosDelta stream · Phase 3d-i.
 *
 * α = 0.3 · LOCKED. At 5 fps, this gives a ~3s response time — fast
 * enough that engagement shifts feel live, slow enough that single-frame
 * flicker (lighting, microexpressions) doesn't oscillate the bars.
 *
 * Phase 3d-iv may expose α via the calibration panel.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import type { PathosDelta } from './face2feel-types';

export const EMA_ALPHA = 0.3;

export function emaSmooth(
  current: PathosDelta,
  previous: PathosDelta | null,
  alpha: number = EMA_ALPHA,
): PathosDelta {
  if (!previous) return current;
  return {
    stress: alpha * current.stress + (1 - alpha) * previous.stress,
    focus: alpha * current.focus + (1 - alpha) * previous.focus,
    curiosity: alpha * current.curiosity + (1 - alpha) * previous.curiosity,
    fatigue: alpha * current.fatigue + (1 - alpha) * previous.fatigue,
    satisfaction:
      alpha * current.satisfaction + (1 - alpha) * previous.satisfaction,
  };
}
