/**
 * Acuterium Master Ops · cognitive engine contracts.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2375-2742.
 *
 * Five engines run as a pipeline at the App() root:
 *   MNEMOS  → persistent operator profile (localStorage)
 *   NEXUS   → behavioral signal collector (1.5s windows)
 *   PATHOS  → 5-axis emotion state (Stress · Focus · Curiosity · Fatigue · Satisfaction)
 *   KAIROS  → 6-mode auto-switch + keyboard shortcuts
 *   TELOS   → intent oracle (top 4 ranked predictions)
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export const KAIROS_MODES = ['aui', 'tuui', 'hud', 'gui', 'dashboard', 'ambient'] as const;
export type KairosMode = (typeof KAIROS_MODES)[number];

export const MODE_LABELS: Record<KairosMode, string> = {
  aui: 'AUI GLASS',
  tuui: 'TUUI TACTILE',
  hud: 'HUD OVERLAY',
  gui: 'GUI CLASSIC',
  dashboard: 'DASHBOARD',
  ambient: 'AMBIENT',
};

/** PATHOS · 5-axis emotion state. Order is load-bearing — DO NOT REORDER. */
export type PathosState = {
  stress: number;
  focus: number;
  curiosity: number;
  fatigue: number;
  satisfaction: number;
};

/** NEXUS · 1.5-second aggregate behavioral signal window. */
export type NexusSignals = {
  mouseVel: number;
  scrollVel: number;
  keyCadence: number;
  idleSeconds: number;
  hasTouch: boolean;
};

/** MNEMOS · localStorage-persisted operator profile. Key 'acu-master-ops:mnemos:v1'. */
export type MnemosProfile = {
  sessions: number;
  firstSeen: string;
  lastSeen: string;
  dominantMode: KairosMode;
  modeHistory: KairosMode[];
  hasTouch: boolean;
  avgMouseVel: number;
  avgScrollVel: number;
  keyCadenceMs: number;
  idleSeconds: number;
  dwellByMode: Record<KairosMode, number>;
  explorationScore: number;
  lastPathos: PathosState;
};

/** TELOS · single intent prediction. Action targets a section id or '_mode:<KairosMode>'. */
export type TelosPrediction = {
  id: string;
  source: string;
  title: string;
  reason: string;
  /** Confidence 0-100. TELOS sorts descending. */
  conf: number;
  /** Section id ('channels' · 'decisions' · 'campaign' · …) OR '_mode:hud' / '_mode:ambient' / etc. */
  action: string;
};
