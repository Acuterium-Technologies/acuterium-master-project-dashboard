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

export type ComputePathosArgs = {
  nexus: NexusSignals;
  profile: MnemosProfile;
  persisted: PersistedState;
};

export function computePATHOS({ nexus, profile, persisted }: ComputePathosArgs): PathosState {
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

  return {
    stress: Math.round(stress),
    focus: Math.round(focus),
    curiosity: Math.round(curiosity),
    fatigue: Math.round(fatigue),
    satisfaction: Math.round(satisfaction),
  };
}

export function applyBreathing(pathos: PathosState): void {
  if (typeof document === 'undefined') return;
  const rate = 4.8 - (pathos.stress / 100) * 2.0;
  document.documentElement.style.setProperty('--breath-rate', rate.toFixed(2) + 's');
}
