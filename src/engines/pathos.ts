/**
 * PATHOS · 5-axis emotion state engine + breathing-rate writer.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2493-2533 (verbatim port).
 *
 * Axis order is LOAD-BEARING — Stress · Focus · Curiosity · Fatigue ·
 * Satisfaction. The OverviewMode radar (Phase 1C) and PathosSidebar both
 * render in this order. Do not reorder per the v1.4 doctrinal red lines.
 *
 * Inputs:
 *   nexus     → live 1.5s aggregate behavioral signals
 *   profile   → MNEMOS-backed persistent operator profile
 *   persisted → usePersistedState() snapshot (closedODs, residueVerdict, done)
 *
 * Outputs:
 *   PathosState  → 5 integers in [0, 100]
 *   applyBreathing(pathos) writes --breath-rate to documentElement.style.
 *   Stress 0   → 4.8s breath
 *   Stress 100 → 2.8s breath
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import { CONFLICTS, DECISIONS, TASKS } from '../data';
import type { PersistedState } from '../data/types';
import type { MnemosProfile, NexusSignals, PathosState } from './types';
import type { PathosDelta } from '../lib/biometrics/face2feel-types';

export type ComputePathosArgs = {
  nexus: NexusSignals;
  profile: MnemosProfile;
  persisted: PersistedState;
  /**
   * Phase A · optional Face2Feel emotion delta ([-1,+1] per axis) + its
   * confidence (0-1). When present (consent active), it nudges the computed
   * 5-axis state so the living interface reacts to facial emotion.
   */
  faceDelta?: PathosDelta | null;
  faceConfidence?: number;
};

export function computePATHOS({
  nexus,
  profile,
  persisted,
  faceDelta,
  faceConfidence,
}: ComputePathosArgs): PathosState {
  const conflictsOpen = CONFLICTS.filter((c) => c.status === 'open').length;
  const odClosed = DECISIONS.filter((d) => persisted.closedODs[d.id]).length;
  const tasksDone = TASKS.filter((t) => persisted.done[t.id]).length;
  const tasksPct = (tasksDone / TASKS.length) * 100;

  let stress = 25 + conflictsOpen * 3.5;
  if (persisted.residueVerdict !== 'CLEAN') stress += 20;
  if (!persisted.closedODs['OD-04']) stress += 12;
  if (nexus.mouseVel > 700) stress += 10;
  stress = Math.max(0, Math.min(100, stress));

  let focus = 70 - Math.min(40, nexus.idleSeconds * 1.2);
  if (nexus.mouseVel > 0 && nexus.mouseVel < 400) focus += 12;
  if (nexus.keyCadence > 50 && nexus.keyCadence < 400) focus += 8;
  focus = Math.max(0, Math.min(100, focus));

  const modeDiversity = new Set((profile.modeHistory || []).slice(-20)).size;
  let curiosity = 40 + modeDiversity * 8 + tasksPct / 3;
  curiosity = Math.max(0, Math.min(100, curiosity));

  let fatigue = 20 + Math.min(40, (profile.sessions || 1) * 2);
  if (nexus.scrollVel < 50 && nexus.idleSeconds > 30) fatigue += 15;
  if (odClosed === 0 && tasksPct < 5) fatigue += 10;
  fatigue = Math.max(0, Math.min(100, fatigue));

  let satisfaction = 35 + odClosed * 4.5 + tasksPct / 2.5;
  if (persisted.residueVerdict === 'CLEAN') satisfaction += 10;
  satisfaction = Math.max(0, Math.min(100, satisfaction));

  // Phase A · blend the Face2Feel delta in (consent-gated, confidence-scaled).
  // Each delta axis is [-1,+1]; FACE_WEIGHT keeps face a nudge, not an override.
  const fc = Math.max(0, Math.min(1, faceConfidence ?? 0));
  const fd = fc > 0 ? faceDelta : null;
  const FACE_WEIGHT = 45; // max ±45-point nudge at full confidence
  const blend = (base: number, dv: number): number =>
    Math.max(0, Math.min(100, base + (fd ? dv * fc * FACE_WEIGHT : 0)));

  return {
    stress: Math.round(blend(stress, fd?.stress ?? 0)),
    focus: Math.round(blend(focus, fd?.focus ?? 0)),
    curiosity: Math.round(blend(curiosity, fd?.curiosity ?? 0)),
    fatigue: Math.round(blend(fatigue, fd?.fatigue ?? 0)),
    satisfaction: Math.round(blend(satisfaction, fd?.satisfaction ?? 0)),
  };
}

/**
 * Phase 3a · named breath-rate tokens.
 * Three discrete bands map to the ACAI V2 canon tokens (--breath-normal,
 * --breath-stressed, --breath-calm). The continuous 4.8s→2.8s formula
 * used in Phase 1D is replaced with these named bands so designers can
 * adjust the three values in one place (src/styles/master-ops.css :root).
 */
export function computeBreathRate(pathos: PathosState): string {
  if (pathos.stress > 70) return 'var(--breath-stressed)';
  if (pathos.stress < 30) return 'var(--breath-calm)';
  return 'var(--breath-normal)';
}

export function applyBreathing(pathos: PathosState): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--breath-rate', computeBreathRate(pathos));
}

/**
 * Phase A · Chameleon tint — maps the emotional state to a subtle accent the
 * consciousness orb (and any consumer of --pathos-accent) glows with:
 *   high stress       → cool blue  (calming, per the Hybrid-Trust doctrine)
 *   high satisfaction → warm gold  (reward)
 *   otherwise         → neutral cyan
 * Written as a CSS custom property so styling stays in one place and the
 * effect is GPU-cheap (a single box-shadow colour).
 */
export function applyChameleon(pathos: PathosState): void {
  if (typeof document === 'undefined') return;
  let accent = 'rgba(0, 229, 212, 0.10)'; // neutral cyan
  if (pathos.stress > 70) accent = 'rgba(75, 159, 255, 0.14)'; // cool blue — calm under stress
  else if (pathos.satisfaction > 65) accent = 'rgba(240, 168, 74, 0.13)'; // warm gold — reward
  document.documentElement.style.setProperty('--pathos-accent', accent);
}
