/**
 * KAIROS · 6-mode auto-switch + keyboard shortcuts + TUUI tactile ripples.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2558-2657 (verbatim port).
 *
 * ┌─ DOCTRINAL RED LINE ──────────────────────────────────────────────┐
 * │ The auto-switch interval MUST be a single long-lived setInterval  │
 * │ initialised ONCE on mount, reading the latest nexus/pathos/mode   │
 * │ via useRef MIRRORS. It must NOT be a useEffect with those values  │
 * │ in the dependency array — that's the v1.2 bug that tore down the  │
 * │ interval every tick, broke the 8-second throttle, and leaked      │
 * │ timers. The refs are written by tiny effects that update on every │
 * │ render (cheap); the interval reads them via .current.             │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Auto-switch rules (throttled to 8 seconds between switches):
 *   touch primary input              → tuui
 *   idle > 300s AND curiosity > 60   → ambient
 *   stress > 80                      → hud
 *   return-from-idle (ambient + active) → aui
 *
 * Keyboard shortcuts (active in any mode, ignored when an input/textarea/
 * contenteditable element has focus):
 *   Esc    → aui
 *   Alt+H  → hud
 *   Alt+T  → tuui
 *   Alt+G  → gui
 *   Alt+D  → dashboard
 *   Alt+M  → ambient
 *
 * useTUUIRipples adds touch-ripple effects on .tuui-target elements when
 * body.mode-tuui is active (pointerdown spawns a 700ms ripple span).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { MNEMOS } from './mnemos';
import { attachTUUIRipples } from './tuui-ripple';
import { startTUUIDetector, TUUI_AUTO_SWITCH_EVENT } from './tuui-detector';
import { KAIROS_MODES, MODE_LABELS } from './types';
import type { KairosMode, MnemosProfile, NexusSignals, PathosState } from './types';

export { KAIROS_MODES, MODE_LABELS };
export type { KairosMode };

export function showModeToast(message: string): void {
  if (typeof document === 'undefined') return;
  const t = document.createElement('div');
  t.className = 'mode-toast';
  t.textContent = message;
  document.body.appendChild(t);
  window.setTimeout(() => t.remove(), 2900);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export type UseKairosArgs = {
  nexus: NexusSignals;
  pathos: PathosState;
  profile: MnemosProfile;
  setProfile: Dispatch<SetStateAction<MnemosProfile>>;
};

export type UseKairosResult = {
  mode: KairosMode;
  setMode: (m: KairosMode) => void;
  autoSwitch: boolean;
  setAutoSwitch: Dispatch<SetStateAction<boolean>>;
};

export function useKAIROS({
  nexus,
  pathos,
  profile,
  setProfile,
}: UseKairosArgs): UseKairosResult {
  const [mode, setModeState] = useState<KairosMode>(profile.dominantMode || 'aui');
  const [autoSwitch, setAutoSwitch] = useState(true);
  const lastAutoSwitchRef = useRef(0);

  /* refs that always point to the latest engines — so the long-lived
     interval below reads current values without tearing itself down
     every render. THIS IS THE LOAD-BEARING PATTERN. */
  const nexusRef = useRef(nexus);
  useEffect(() => {
    nexusRef.current = nexus;
  }, [nexus]);
  const pathosRef = useRef(pathos);
  useEffect(() => {
    pathosRef.current = pathos;
  }, [pathos]);
  const modeRef = useRef<KairosMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const autoRef = useRef(autoSwitch);
  useEffect(() => {
    autoRef.current = autoSwitch;
  }, [autoSwitch]);

  const apply = useCallback(
    (m: KairosMode, source: 'init' | 'user' | 'kairos' = 'user') => {
      if (typeof document !== 'undefined') {
        const body = document.body;
        KAIROS_MODES.forEach((x) => body.classList.remove('mode-' + x));
        body.classList.add('mode-' + m);
      }
      setModeState(m);
      if (source === 'kairos') showModeToast('KAIROS → ' + MODE_LABELS[m]);
      setProfile((p) => {
        const history = [...(p.modeHistory || []), m].slice(-40);
        const np: MnemosProfile = { ...p, dominantMode: m, modeHistory: history };
        MNEMOS.save(np);
        return np;
      });
    },
    [setProfile],
  );

  // Initial body class — runs once on mount.
  useEffect(() => {
    apply(modeRef.current, 'init');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === 'Escape') {
        apply('aui', 'user');
        return;
      }
      if (!e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'h') apply('hud', 'user');
      else if (k === 't') apply('tuui', 'user');
      else if (k === 'g') apply('gui', 'user');
      else if (k === 'd') apply('dashboard', 'user');
      else if (k === 'm') apply('ambient', 'user');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [apply]);

  // Phase 3c.02 · external auto-switch event (e.g. the TUUI detector
  // dispatches { mode: 'tuui', source: 'nexus' } after idle + coarse-pointer
  // detection). Treated as a 'kairos' source so the mode toast fires too.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAutoSwitch = (e: Event) => {
      const detail = (e as CustomEvent<{ mode?: KairosMode }>).detail;
      const m = detail?.mode;
      if (!m) return;
      if (!KAIROS_MODES.includes(m)) return;
      if (modeRef.current === m) return;
      apply(m, 'kairos');
    };
    window.addEventListener(TUUI_AUTO_SWITCH_EVENT, onAutoSwitch);
    return () => window.removeEventListener(TUUI_AUTO_SWITCH_EVENT, onAutoSwitch);
  }, [apply]);

  /* SINGLE long-lived auto-switch interval. Mounts once, reads refs.
     8-second throttle prevents flicker. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = window.setInterval(() => {
      if (!autoRef.current) return;
      const now = Date.now();
      if (now - lastAutoSwitchRef.current < 8000) return;
      const n = nexusRef.current;
      const p = pathosRef.current;
      const m = modeRef.current;

      if (n.hasTouch && m !== 'tuui' && m !== 'ambient') {
        apply('tuui', 'kairos');
        lastAutoSwitchRef.current = now;
        return;
      }
      if (n.idleSeconds > 300 && p.curiosity > 60 && m !== 'ambient') {
        apply('ambient', 'kairos');
        lastAutoSwitchRef.current = now;
        return;
      }
      if (p.stress > 80 && m !== 'hud' && m !== 'gui') {
        apply('hud', 'kairos');
        lastAutoSwitchRef.current = now;
        return;
      }
      if (m === 'ambient' && n.idleSeconds < 5 && !n.hasTouch) {
        apply('aui', 'kairos');
        lastAutoSwitchRef.current = now;
        return;
      }
    }, 2000);
    return () => window.clearInterval(t);
  }, [apply]);

  return {
    mode,
    setMode: (m: KairosMode) => apply(m, 'user'),
    autoSwitch,
    setAutoSwitch,
  };
}

/**
 * Phase 3c.02 · TUUI ripple physics + idle/coarse auto-activation.
 *
 * Delegates to the new modules:
 *   src/engines/tuui-ripple.ts   — global touchstart + click listener pair,
 *                                  fires .tuui-ripple spans only when
 *                                  body.mode-tuui is set (auto-cleanup on
 *                                  `animationend`, 600 ms cubic-bezier).
 *   src/engines/tuui-detector.ts — 10 s idle + coarse-pointer detector
 *                                  that dispatches `kairos:auto-switch`.
 *
 * The pre-3c inline pointerdown ripple was removed to avoid double-fire
 * on touch devices (pointerdown + touchstart would otherwise both run).
 * Hook signature is preserved for call-site stability.
 */
export function useTUUIRipples(_mode: KairosMode): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    attachTUUIRipples();
    const detector = startTUUIDetector();
    return () => {
      detector.stop();
    };
  }, []);
}
