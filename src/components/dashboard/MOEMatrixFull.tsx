/**
 * MOE Expert Matrix · full canvas · Phase 3c.05 (F-13 cleanup).
 *
 * Activates when `?dashboard=moe` is in the URL. Renders the 785-expert
 * grid (35 × 23 cells + 20 trailing inactive) at container width up to
 * 1000 × 600 px. DPR-scaled canvas so retina displays render crisp.
 *
 * Reuses the Phase 3b `/api/dashboard/moe-stream` SSE channel — same
 * tick cadence as the right-rail Mini renderer. Hover surfaces a DOM
 * tooltip (not canvas text) for a clean cursor + accessibility story.
 *
 * Stream cleanup: closes on unmount and on document.hidden (visibility
 * change) so a backgrounded tab doesn't pin a zombie EventSource.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import {
  EXPERT_DOMAINS,
  GRID_COLS,
  GRID_ROWS,
  type ExpertDomain,
  type ExpertNode,
  type MOESnapshot,
} from '../../lib/moe/types';

const DOMAIN_COLORS: Record<ExpertDomain, string> = {
  language: '#00E5D4',
  reasoning: '#7B68EE',
  code: '#30D158',
  legal: '#C9A84C',
  finance: '#FF6B35',
  security: '#FF3B30',
};

const MAX_HEIGHT = 600;
const ASPECT = 0.6;

interface HoverInfo {
  expert: ExpertNode;
  x: number;
  y: number;
}

export function MOEMatrixFull() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<MOESnapshot | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;

    function connect() {
      if (es || cancelled) return;
      try {
        es = new EventSource('/api/dashboard/moe-stream', { withCredentials: true });
        es.onmessage = (ev) => {
          if (cancelled) return;
          try {
            const snap = JSON.parse(ev.data) as MOESnapshot;
            if (snap && Array.isArray(snap.experts)) {
              setSnapshot(snap);
            }
          } catch {
            /* silent */
          }
        };
        es.onerror = () => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !snapshot) return;

    const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.min(w * ASPECT, MAX_HEIGHT);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    for (let i = 0; i < snapshot.experts.length; i++) {
      const e = snapshot.experts[i];
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = col * cellW;
      const y = row * cellH;

      if (e.active) {
        ctx.fillStyle = DOMAIN_COLORS[e.domain];
        ctx.globalAlpha = 0.2 + e.activationStrength * 0.8;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = DOMAIN_COLORS[e.domain];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      } else {
        ctx.fillStyle = 'rgba(0, 229, 212, 0.04)';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    }
  }, [snapshot]);

  function handleMouseMove(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (!snapshot) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const col = Math.floor(mx / cellW);
    const row = Math.floor(my / cellH);
    const i = row * GRID_COLS + col;

    if (i >= 0 && i < snapshot.experts.length) {
      setHover({
        expert: snapshot.experts[i],
        x: mx,
        y: my,
      });
    } else {
      setHover(null);
    }
  }

  function handleMouseLeave() {
    setHover(null);
  }

  return (
    <div ref={containerRef} className="acu-moe-full" data-qa="moe-matrix-full">
      <header className="acu-moe-full__header">
        <h2>MOE Expert Activation Matrix</h2>
        {snapshot && (
          <div className="acu-moe-full__stats">
            <span className="acu-moe-full__total">Active: {snapshot.totalActive} / 785</span>
            {EXPERT_DOMAINS.map((d) => (
              <span key={d} className="acu-moe-full__domain-count">
                <span
                  className="acu-moe-full__domain-swatch"
                  style={{ background: DOMAIN_COLORS[d] }}
                />
                {d}: {snapshot.domainCounts[d] ?? 0}
              </span>
            ))}
          </div>
        )}
      </header>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="MOE Expert Matrix · 785 experts · 6 domains · hover for detail"
      />

      {hover && (
        <div
          className="acu-moe-full__tooltip"
          style={{
            left: hover.x + 12,
            top: Math.max(hover.y - 28, 0),
          }}
          data-qa="moe-matrix-full-tooltip"
        >
          Expert #{hover.expert.id} · {hover.expert.domain}
          {hover.expert.active
            ? ` · strength ${hover.expert.activationStrength.toFixed(2)}`
            : ' · idle'}
        </div>
      )}
    </div>
  );
}
