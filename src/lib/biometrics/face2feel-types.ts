/**
 * Face2Feel · type contracts · Phase 3d-i.
 *
 * IMPORTANT: this PathosDelta type is INTERNAL to the biometrics module —
 * uses [-1, +1] floats for compactness in the inference pipeline.
 * It is distinct from src/engines/types.ts `PathosState` (0..100 integers,
 * used by the v1.3-ported PATHOS engine). Both coexist deliberately;
 * Phase 3d-iv ships the calibration panel that fuses them.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
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

/**
 * 5-axis PATHOS delta in [-1, +1].
 * Axis order is LOAD-BEARING (matches PathosState):
 *   Stress · Focus · Curiosity · Fatigue · Satisfaction
 */
export interface PathosDelta {
  stress: number;
  focus: number;
  curiosity: number;
  fatigue: number;
  satisfaction: number;
}

export type Face2FeelSource = 'face' | 'voice' | 'touch' | 'fused';

export interface Face2FeelSample {
  delta: PathosDelta | null;
  confidence: number;
  source: Face2FeelSource;
  timestamp: number;
}

export type ConsentTier = 'off' | 'session' | 'persistent';
export type Channel = 'face2feel' | 'voice2feel' | 'touch2feel';

export interface ConsentRecord {
  channel: Channel;
  tier: ConsentTier;
  grantedAt: string;
  grantedVersion: 'v1';
}

/* ── Worker IPC contract ───────────────────────────────────────────── */

export type Face2FeelInbound =
  | { type: 'INIT' }
  | { type: 'FRAME'; bitmap: ImageBitmap; timestamp: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SHUTDOWN' };

export type Face2FeelOutbound =
  | { type: 'READY' }
  | { type: 'PATHOS'; delta: PathosDelta | null; confidence: number; timestamp: number }
  | { type: 'ERROR'; code: string; message: string };
