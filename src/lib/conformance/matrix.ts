/**
 * ACAI V2 structural conformance matrix · Phase 3b.03.
 *
 * 22 rows · each is a boolean check that runs at render time against
 * the current DOM, CSS variables, and engine state. The composite score
 * the gauge displays = 0.7 × structural + 0.3 × operational (LOCKED).
 *
 * Article 22 boundary held: the matrix REPORTS · the operator DECIDES.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export interface ConformanceRow {
  category: 'Tokens' | 'Modes' | 'Engines' | 'Sensors' | 'CHRONOS' | 'Compliance';
  expected: string;
  present: boolean;
  weight: number;
}

export interface StructuralConformance {
  rows: ConformanceRow[];
  score: number;
  earnedWeight: number;
  totalWeight: number;
}

type AcaiWindow = Window & {
  __acai?: {
    kairos?: unknown;
    pathos?: unknown;
    nexus?: unknown;
    telos?: unknown;
  };
};

function hasStyleVar(name: string): boolean {
  if (typeof document === 'undefined') return false;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value) return true;
  // jsdom + some bundlers don't surface custom-property values via getComputedStyle.
  // Fall back to the inline style declaration so unit tests can stub via documentElement.style.setProperty.
  return document.documentElement.style.getPropertyValue(name).trim() !== '';
}

function styleVarEquals(name: string, expected: string): boolean {
  if (typeof document === 'undefined') return false;
  const value =
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    document.documentElement.style.getPropertyValue(name).trim();
  return value === expected;
}

function hasBodyMode(): boolean {
  if (typeof document === 'undefined') return false;
  return (
    document.body.classList.contains('mode-aui') ||
    document.body.classList.contains('mode-hud') ||
    document.body.classList.contains('mode-tuui') ||
    document.body.classList.contains('mode-gui') ||
    document.body.classList.contains('mode-dashboard') ||
    document.body.classList.contains('mode-ambient')
  );
}

function querySelectorPresent(selector: string): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector(selector);
}

function engineExposed(key: 'kairos' | 'pathos' | 'nexus' | 'telos' | 'face2feel'): boolean {
  if (typeof window === 'undefined') return false;
  const acai = (window as AcaiWindow).__acai;
  return !!(acai && (acai as Record<string, unknown>)[key]);
}

function localStorageHas(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!window.localStorage.getItem(key);
  } catch {
    return false;
  }
}

export function computeStructuralConformance(): StructuralConformance {
  const rows: ConformanceRow[] = [
    // ─── Design tokens (Phase 3a · all four landed) ────────────────────
    { category: 'Tokens', expected: '--radius-lg = 22px', present: styleVarEquals('--radius-lg', '22px'), weight: 5 },
    { category: 'Tokens', expected: '--breath-stressed defined', present: hasStyleVar('--breath-stressed'), weight: 4 },
    { category: 'Tokens', expected: '--breath-calm defined', present: hasStyleVar('--breath-calm'), weight: 4 },
    { category: 'Tokens', expected: 'Government Edition tokens (--bg-gov)', present: hasStyleVar('--bg-gov'), weight: 6 },

    // ─── 6 modes ───────────────────────────────────────────────────────
    { category: 'Modes', expected: 'A KAIROS mode class active on body', present: hasBodyMode(), weight: 8 },
    { category: 'Modes', expected: 'TUUI ripple physics ready', present: querySelectorPresent('[data-tuui-ripple-ready]'), weight: 5 },
    { category: 'Modes', expected: 'HUD scanlines overlay', present: querySelectorPresent('body.mode-hud') || querySelectorPresent('style[data-mode-hud-scanlines]'), weight: 6 },
    { category: 'Modes', expected: 'GUI Classic government tokens', present: hasStyleVar('--bg-gov'), weight: 6 },
    { category: 'Modes', expected: 'Dashboard BI grid mounted', present: querySelectorPresent('[data-qa="bi-grid"]'), weight: 9 },
    { category: 'Modes', expected: 'Ambient particle density ready', present: querySelectorPresent('[data-ambient-particles-ready]'), weight: 4 },

    // ─── Engines (Phase 1D pipeline) ───────────────────────────────────
    { category: 'Engines', expected: 'KAIROS exposed via window.__acai.kairos', present: engineExposed('kairos'), weight: 10 },
    { category: 'Engines', expected: 'PATHOS exposed via window.__acai.pathos', present: engineExposed('pathos'), weight: 10 },
    { category: 'Engines', expected: 'NEXUS exposed via window.__acai.nexus', present: engineExposed('nexus'), weight: 8 },
    { category: 'Engines', expected: 'MNEMOS v1 key in localStorage', present: localStorageHas('acu-master-ops:mnemos:v1'), weight: 9 },
    { category: 'Engines', expected: 'TELOS prediction panel rendered', present: querySelectorPresent('[data-qa="telos-oracle"]') || querySelectorPresent('#telos-panel'), weight: 7 },

    // ─── Sensors (Phase 3d · partial) ──────────────────────────────────
    // Phase 3d-i lights Face2Feel rows; Voice/Touch/Sentinel-Light follow in 3d-ii..v.
    { category: 'Sensors', expected: 'Face2Feel engine exposed via window.__acai.face2feel', present: engineExposed('face2feel'), weight: 5 },
    { category: 'Sensors', expected: 'Face2Feel consent panel mounted', present: querySelectorPresent('[data-qa="face2feel-consent-panel"]'), weight: 3 },
    { category: 'Sensors', expected: 'Voice2Feel consent gate', present: querySelectorPresent('[data-qa="voice2feel-consent"]'), weight: 7 },
    { category: 'Sensors', expected: 'Touch2Feel gesture capture', present: querySelectorPresent('[data-qa="touch2feel-ready"]'), weight: 5 },
    { category: 'Sensors', expected: 'Sentinel-Light always-on', present: querySelectorPresent('[data-qa="sentinel-light"]'), weight: 9 },

    // ─── CHRONOS (Phase 3c) ────────────────────────────────────────────
    { category: 'CHRONOS', expected: 'GCC prayer-time gradient', present: hasStyleVar('--chronos-gradient'), weight: 4 },

    // ─── Compliance (server-verified · placeholder false until wired) ──
    { category: 'Compliance', expected: 'DPIA signed and present', present: false, weight: 8 },
    { category: 'Compliance', expected: 'Right to erasure endpoint', present: false, weight: 7 },
  ];

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const earnedWeight = rows.filter((r) => r.present).reduce((s, r) => s + r.weight, 0);
  const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

  return { rows, score, earnedWeight, totalWeight };
}
