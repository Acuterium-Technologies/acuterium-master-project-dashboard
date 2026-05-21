/**
 * MOE Expert Matrix · mini canvas · Phase 3b.02.
 *
 * 280 × 140 px canvas · 35×23 grid · 5 px per cell. Subscribes to
 * /api/dashboard/moe-stream (SSE, ~5s ticks) and renders each snapshot
 * with the canonical 6-domain colour palette. Closes the stream when
 * the tab is hidden (visibilitychange) so we don't keep a zombie
 * EventSource pinned to a backgrounded surface.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef } from 'react';

import { GRID_COLS, GRID_ROWS, type ExpertDomain, type ExpertNode } from '../../lib/moe/types';

const DOMAIN_COLORS: Record<ExpertDomain, string> = {
  language: '#00E5D4',
  reasoning: '#7B68EE',
  code: '#30D158',
  legal: '#C9A84C',
  finance: '#FF6B35',
  security: '#FF3B30',
};

const WIDTH = 280;
const HEIGHT = 140;
const GHOST = 'rgba(0, 229, 212, 0.04)';

function render(ctx: CanvasRenderingContext2D, experts: ExpertNode[]): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const cellW = WIDTH / GRID_COLS;
  const cellH = HEIGHT / GRID_ROWS;

  for (let i = 0; i < experts.length; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const x = col * cellW;
    const y = row * cellH;
    const e = experts[i];

    if (e.active) {
      ctx.globalAlpha = 0.2 + e.activationStrength * 0.8;
      ctx.fillStyle = DOMAIN_COLORS[e.domain];
      ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = GHOST;
      ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }
  }
}

export function MOEMatrixMini() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let es: EventSource | null = null;

    function connect() {
      try {
        es = new EventSource('/api/dashboard/moe-stream', { withCredentials: true });
        es.onmessage = (ev) => {
          if (cancelled || !ctx) return;
          try {
            const snapshot = JSON.parse(ev.data) as { experts: ExpertNode[] };
            if (snapshot && Array.isArray(snapshot.experts)) {
              render(ctx, snapshot.experts);
            }
          } catch {
            /* silent */
          }
        };
        es.onerror = () => {
          // Native EventSource reconnects on its own — close only on visibility loss.
          if (typeof document !== 'undefined' && document.hidden && es) {
            es.close();
            es = null;
          }
        };
      } catch {
        es = null;
      }
    }

    function handleVisibility() {
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        if (es) {
          es.close();
          es = null;
        }
      } else if (!es) {
        connect();
      }
    }

    connect();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      cancelled = true;
      if (es) es.close();
      es = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="acu-moe-matrix-mini"
      data-qa="moe-matrix-mini"
      aria-label="MOE Expert Matrix · 785 experts · 6 domains"
    />
  );
}
