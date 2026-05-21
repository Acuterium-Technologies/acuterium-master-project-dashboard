/**
 * Particle background — sovereign canvas overlay.
 * Phase 3c.03 · density variance per KAIROS mode + hard cap + RM/visibility.
 *
 * Looks for `<canvas id="bg-canvas">` on mount, sizes it to the viewport,
 * scatters cyan-tinted particles, and draws connecting lines between
 * neighbours under 110 px. The look-and-feel is the consciousness layer
 * behind every mode — KAIROS modes tune opacity via CSS variables AND
 * particle count via MODE_DENSITY_MULTIPLIERS.
 *
 * Per-mode density (ACAI V2 canon · Phase 3c.03):
 *   AUI       1.0×   Ambient   3.0×   HUD       0.3×
 *   TUUI      1.5×   GUI       0.5×   Dashboard 1.0×
 *
 * Hard cap: 200 particles globally (memory safety on high-res displays).
 * Reduced-motion: initial frame still draws · RAF loop cancelled.
 * Tab hidden: RAF loop paused; resumes on visibilitychange.
 * Mode change: particle array is rebuilt in-place; the RAF loop stays
 * single-shot (mirror-ref pattern from kairos.ts).
 *
 * window.__acai.particleNetwork = { particles, mode } exposes the
 * particle array for the ACAI conformance probe + Playwright tests.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef } from 'react';

import type { KairosMode } from '../../engines/types';

type Particle = { x: number; y: number; vx: number; vy: number; r: number; o: number };

export const PARTICLE_HARD_CAP = 200;
export const PARTICLE_DIVISOR = 24000;

/**
 * Per-mode density multipliers · ACAI V2 canon (LOCKED).
 * Locked in spec 3c.03 — do not adjust without operator sign-off.
 */
export const MODE_DENSITY_MULTIPLIERS: Record<KairosMode, number> = {
  aui: 1.0,
  ambient: 3.0,
  hud: 0.3,
  tuui: 1.5,
  gui: 0.5,
  dashboard: 1.0,
};

/**
 * Compute particle count for a viewport at a given mode. Pure function —
 * unit-testable without DOM mocks. Floors before multiplying, applies the
 * 200 hard cap last.
 */
export function computeParticleCount(width: number, height: number, mode: KairosMode): number {
  const base = Math.floor((width * height) / PARTICLE_DIVISOR);
  const multiplier = MODE_DENSITY_MULTIPLIERS[mode] ?? 1.0;
  return Math.min(Math.floor(base * multiplier), PARTICLE_HARD_CAP);
}

type AcaiWindow = Window & {
  __acai?: Record<string, unknown> & {
    particleNetwork?: { particles: Particle[]; mode: KairosMode };
  };
};

export function useParticles(canvasId: string = 'bg-canvas', mode: KairosMode = 'aui'): void {
  const modeRef = useRef<KairosMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setAttribute('data-ambient-particles-ready', '1');

    let raf = 0;
    let parts: Particle[] = [];
    let w = 0;
    let h = 0;
    let running = false;

    const reducedMotion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const buildParticles = (n: number): Particle[] =>
      Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.4,
        o: Math.random() * 0.5 + 0.1,
      }));

    const exposeNetwork = (): void => {
      if (typeof window === 'undefined') return;
      const w0 = window as AcaiWindow;
      const existing = (w0.__acai ?? {}) as Record<string, unknown>;
      w0.__acai = {
        ...existing,
        particleNetwork: { particles: parts, mode: modeRef.current },
      };
    };

    const resize = (): void => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const n = computeParticleCount(w, h, modeRef.current);
      parts = buildParticles(n);
      exposeNetwork();
    };

    const drawFrame = (): void => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,212,${p.o})`;
        ctx.fill();
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i];
          const b = parts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,229,212,${0.14 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const loop = (): void => {
      drawFrame();
      raf = requestAnimationFrame(loop);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = (): void => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onModeChange = () => {
      const n = computeParticleCount(w, h, modeRef.current);
      parts = buildParticles(n);
      exposeNetwork();
      // Single frame so the new count is visible even when paused.
      drawFrame();
    };

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        stop();
      } else if (!(reducedMotion && reducedMotion.matches)) {
        start();
      }
    };

    const onReducedMotionChange = () => {
      if (reducedMotion && reducedMotion.matches) {
        stop();
        drawFrame();
      } else {
        start();
      }
    };

    resize();
    drawFrame();
    if (!(reducedMotion && reducedMotion.matches)) {
      start();
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (reducedMotion && typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', onReducedMotionChange);
    }
    window.addEventListener('acu:particles:mode-change', onModeChange);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (reducedMotion && typeof reducedMotion.removeEventListener === 'function') {
        reducedMotion.removeEventListener('change', onReducedMotionChange);
      }
      window.removeEventListener('acu:particles:mode-change', onModeChange);
      canvas.removeAttribute('data-ambient-particles-ready');
      // Clean up the window probe entry.
      const w0 = window as AcaiWindow;
      if (w0.__acai && typeof w0.__acai === 'object' && 'particleNetwork' in w0.__acai) {
        try {
          delete (w0.__acai as { particleNetwork?: unknown }).particleNetwork;
        } catch {
          /* ignore */
        }
      }
    };
  }, [canvasId]);

  // Mode change effect: dispatch a window event the singleton listener picks up.
  // Keeps the RAF loop singleton (long-lived) instead of tearing it down.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('acu:particles:mode-change', { detail: { mode } }));
  }, [mode]);
}
