/**
 * Multi-Sensory Feedback · Phase B (TB-01 haptics · TB-03 coordination).
 *
 * One entry point — provideFeedback(event) — that fires a COORDINATED response
 * across three channels for the same operator event:
 *   · visual  → a brief full-screen accent pulse (skipped under reduced-motion)
 *   · haptic  → navigator.vibrate(pattern) on supported touch devices (TUUI is
 *               the tactile-first context; gracefully no-ops on iOS/desktop)
 *   · audio   → a subtle WebAudio tone, OPT-IN only (default off)
 *
 * Preferences (localStorage):
 *   acu-haptics-off = '1'  → disable haptics
 *   acu-audio-on    = '1'  → enable the optional audio cue
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

export type FeedbackEvent = 'save' | 'deny' | 'report' | 'mode' | 'toggle';

const HAPTIC: Record<FeedbackEvent, number[]> = {
  save: [12],
  toggle: [8],
  deny: [22, 40, 22],
  report: [10, 30, 10],
  mode: [6],
};

const PULSE_COLOR: Record<FeedbackEvent, string> = {
  save: 'rgba(48,209,88,0.28)', // green
  toggle: 'rgba(0,229,212,0.20)', // cyan
  deny: 'rgba(255,59,48,0.32)', // red
  report: 'rgba(123,104,238,0.26)', // violet
  mode: 'rgba(0,229,212,0.18)',
};

const TONE_HZ: Record<FeedbackEvent, number> = {
  save: 660,
  toggle: 520,
  deny: 220,
  report: 590,
  mode: 480,
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function hapticsEnabled(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try {
    return window.localStorage.getItem('acu-haptics-off') !== '1';
  } catch {
    return true;
  }
}

function audioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('acu-audio-on') === '1';
  } catch {
    return false;
  }
}

let pulseTimer: number | undefined;
let audioCtx: AudioContext | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function playTone(event: FeedbackEvent): void {
  try {
    const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = TONE_HZ[event];
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    /* audio is best-effort */
  }
}

/**
 * Fire coordinated feedback for an operator event. Safe to call from any client
 * code path; every channel is independently guarded + preference-gated.
 */
export function provideFeedback(event: FeedbackEvent): void {
  if (typeof document === 'undefined') return;

  // Visual — a brief accent pulse (full-screen vignette), reduced-motion aware.
  if (!prefersReducedMotion()) {
    const body = document.body;
    document.documentElement.style.setProperty('--feedback-color', PULSE_COLOR[event]);
    body.classList.remove('acu-fb-pulse');
    void body.offsetWidth; // reflow so the animation restarts on rapid repeats
    body.classList.add('acu-fb-pulse');
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => body.classList.remove('acu-fb-pulse'), 700);
  }

  // Haptic — touch devices only, preference-gated, no-ops where unsupported.
  if (hapticsEnabled()) {
    try {
      navigator.vibrate(HAPTIC[event]);
    } catch {
      /* ignore */
    }
  }

  // Audio — opt-in only (default off).
  if (audioEnabled()) playTone(event);
}
