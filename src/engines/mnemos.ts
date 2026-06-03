/**
 * MNEMOS · operator memory core.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2375-2406 (verbatim port).
 *
 * Persists the long-running operator profile across sessions. Layer 1 is
 * localStorage (synchronous). Layer 2 is the optional window.storage shared
 * bridge (Claude shared-mode storage when present — the surface works without
 * it).
 *
 * Persistence key is LOCKED at 'acu-master-ops:mnemos:v1' per the v1.4
 * doctrinal red lines — do not rev to v2 without a migration story.
 *
 * Session counter increments on every load() call. The KAIROS engine writes
 * dominantMode + modeHistory back through save(); the NEXUS engine writes
 * the rolling EMA of mouse/scroll/key signals.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { MnemosProfile } from './types';

export const MNEMOS_KEY = 'acu-master-ops:mnemos:v1';

type SharedStorage = {
  set: (key: string, value: string, sync?: boolean) => unknown;
};

function defaults(): MnemosProfile {
  const now = new Date().toISOString();
  return {
    sessions: 1,
    firstSeen: now,
    lastSeen: now,
    dominantMode: 'aui',
    modeHistory: [],
    autoSwitch: true,
    hasTouch: false,
    avgMouseVel: 0,
    avgScrollVel: 0,
    keyCadenceMs: 0,
    idleSeconds: 0,
    dwellByMode: { aui: 0, tuui: 0, hud: 0, gui: 0, dashboard: 0, ambient: 0 },
    explorationScore: 50,
    lastPathos: { stress: 50, focus: 50, curiosity: 50, fatigue: 35, satisfaction: 50 },
  };
}

function load(): MnemosProfile {
  if (typeof window === 'undefined') return defaults();
  try {
    const raw = window.localStorage.getItem(MNEMOS_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<MnemosProfile>;
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

function save(p: MnemosProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MNEMOS_KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
  const ws = (window as unknown as { storage?: Partial<SharedStorage> }).storage;
  if (ws && typeof ws.set === 'function') {
    try {
      (ws as SharedStorage).set(MNEMOS_KEY, JSON.stringify(p), true);
    } catch {
      // ignore shared-bridge errors
    }
  }
}

export const MNEMOS = {
  load,
  save,
  defaults,
};
