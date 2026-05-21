/**
 * TUUI auto-activation detector · Phase 3c.02.
 *
 * Watches for the signal "10 s of no mousemove AND pointer is coarse",
 * then dispatches `kairos:auto-switch` with `{ mode: 'tuui', source: 'nexus' }`.
 * The useKAIROS hook listens for this event and applies the mode the same
 * way it handles its own auto-switch loop.
 *
 * Why a separate detector rather than re-using KAIROS's interval?
 * KAIROS's existing interval already auto-switches to tuui when
 * `nexus.hasTouch && mode !== 'tuui'`. This module narrows the trigger
 * to "page-load + idle + coarse-pointer", giving a deterministic UX
 * for cold-load on a phone/tablet without waiting on NEXUS warmup.
 *
 * Cleanup contract: returns an unsubscribe function so the React caller
 * can detach in its useEffect teardown.
 *
 * Doctrinal red-lines:
 * - 10 s threshold matches the Phase 3c.02 spec (no false positives on
 *   desktop · operator can override via Alt+T keyboard shortcut).
 * - Idempotent: re-calling activate() does not stack timers.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

export const TUUI_AUTO_ACTIVATE_DELAY_MS = 10_000;
export const TUUI_AUTO_SWITCH_EVENT = 'kairos:auto-switch';

export interface TUUIAutoSwitchDetail {
  mode: 'tuui';
  source: 'nexus';
}

interface TUUIDetectorHandle {
  stop: () => void;
}

let active: TUUIDetectorHandle | null = null;

export function startTUUIDetector(): TUUIDetectorHandle {
  if (active) return active;
  if (typeof window === 'undefined') {
    return { stop: () => {} };
  }

  let lastMouseMove = Date.now();
  const isPointerCoarse =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;

  const onMouseMove = (): void => {
    lastMouseMove = Date.now();
  };

  document.addEventListener('mousemove', onMouseMove, { passive: true });

  const timer = window.setTimeout(() => {
    if (Date.now() - lastMouseMove >= TUUI_AUTO_ACTIVATE_DELAY_MS - 1_000 && isPointerCoarse) {
      const detail: TUUIAutoSwitchDetail = { mode: 'tuui', source: 'nexus' };
      window.dispatchEvent(new CustomEvent(TUUI_AUTO_SWITCH_EVENT, { detail }));
    }
  }, TUUI_AUTO_ACTIVATE_DELAY_MS);

  const stop = (): void => {
    window.clearTimeout(timer);
    document.removeEventListener('mousemove', onMouseMove);
    active = null;
  };

  active = { stop };
  return active;
}

/** Test-only escape hatch — clears the module-level handle. */
export function __resetTUUIDetectorForTests(): void {
  if (active) active.stop();
  active = null;
}
