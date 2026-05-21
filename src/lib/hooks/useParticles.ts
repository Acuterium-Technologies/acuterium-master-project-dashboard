/**
 * Particle background — sovereign canvas overlay.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1337-1359.
 *
 * Looks for `<canvas id="bg-canvas">` on mount, sizes it to the viewport,
 * scatters cyan-tinted particles, and draws connecting lines between
 * neighbours under 110 px. The look-and-feel is the consciousness layer
 * behind every mode — KAIROS modes tune opacity via CSS variables.
 *
 * Density scales with viewport area (capped at 80 particles) so high-DPR
 * laptops don't pay the cost a 4K external monitor pays.
 *
 * Cleanup cancels the RAF and detaches the resize listener.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect } from 'react';

type Particle = { x: number; y: number; vx: number; vy: number; r: number; o: number };

export function useParticles(canvasId: string = 'bg-canvas'): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let parts: Particle[] = [];
    let w = 0;
    let h = 0;

    const resize = (): void => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const n = Math.min(Math.floor((w * h) / 24000), 80);
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.4,
        o: Math.random() * 0.5 + 0.1,
      }));
    };

    const loop = (): void => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x = ((p.x + p.vx) + w) % w;
        p.y = ((p.y + p.vy) + h) % h;
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
      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasId]);
}
