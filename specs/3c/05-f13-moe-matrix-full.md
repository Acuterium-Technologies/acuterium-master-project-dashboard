# Spec 3c.05 · F-13 Cleanup · MOEMatrixFull Implementation

**Sub-phase:** 3c
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved · CLEANUP from Phase 3b post-mortem
**Estimated time:** 25 min
**Closes:** F-13 (MOEMatrixFull.tsx empty file from Phase 3b)

---

## Why

Phase 3b's spec 02-moe-expert-matrix.md called for two MOE matrix renderers:
- **Mini** (right rail, 280 × 140 px, 5 Hz) → ✅ shipped at `src/components/dashboard/MOEMatrixMini.tsx` (3530 bytes, working)
- **Full** (center canvas, activated by `?dashboard=moe` query, 1000 × 600 px, 10 Hz, hover tooltips) → ❌ shipped as 0-byte placeholder

F-13 was filed by Perplexity in the Phase 3b QA audit. Phase 3c.05 fills the placeholder.

## Out of scope

- Real DIARAN-MOE wiring (Phase 4+ candidate · 3c.05 keeps the simulator)
- Per-expert click-through to inspect routing decisions
- Historical activation playback

## Implementation

### `src/components/dashboard/MOEMatrixFull.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExpertNode, ExpertDomain, MOESnapshot } from '@/src/lib/moe/types';

const DOMAIN_COLORS: Record<ExpertDomain, string> = {
  language:  '#00E5D4',
  reasoning: '#7B68EE',
  code:      '#30D158',
  legal:     '#C9A84C',
  finance:   '#FF6B35',
  security:  '#FF3B30',
};

const COLS = 35;
const ROWS = 23;

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
      es = new EventSource('/api/dashboard/moe-stream');
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const snap = JSON.parse(ev.data);
          setSnapshot(snap);
        } catch (err) {
          // Silent
        }
      };
      es.onerror = () => {
        if (es) { es.close(); es = null; }
      };
    }

    function handleVisibility() {
      if (document.hidden) {
        if (es) { es.close(); es = null; }
      } else {
        connect();
      }
    }

    connect();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (es) es.close();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !snapshot) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = Math.min(rect.width * 0.6, 600);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const cellW = w / COLS;
    const cellH = h / ROWS;

    for (let i = 0; i < snapshot.experts.length; i++) {
      const e = snapshot.experts[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
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

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!snapshot) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;
    const col = Math.floor(mx / cellW);
    const row = Math.floor(my / cellH);
    const i = row * COLS + col;

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
            <span>Active: {snapshot.totalActive} / 785</span>
            {(Object.keys(DOMAIN_COLORS) as ExpertDomain[]).map(d => (
              <span key={d} className="acu-moe-full__domain-count">
                <span className="acu-moe-full__domain-swatch" style={{ background: DOMAIN_COLORS[d] }} />
                {d}: {snapshot.domainCounts[d]}
              </span>
            ))}
          </div>
        )}
      </header>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {hover && (
        <div
          className="acu-moe-full__tooltip"
          style={{
            left: hover.x + 12,
            top: hover.y - 28,
          }}
        >
          Expert #{hover.expert.id} · {hover.expert.domain}
          {hover.expert.active && ` · strength ${hover.expert.activationStrength.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
```

### CSS additions to `src/styles/bi-grid.css` (or new `src/styles/moe-full.css`)

```css
.acu-moe-full {
  position: relative;
  background: var(--glass-panel);
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.acu-moe-full__header {
  margin-bottom: 12px;
}

.acu-moe-full__header h2 {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--cyan-prime);
  margin: 0 0 8px;
}

.acu-moe-full__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.acu-moe-full__domain-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.acu-moe-full__domain-swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-sm);
}

.acu-moe-full canvas {
  cursor: crosshair;
  background: rgba(0, 0, 0, 0.20);
  border-radius: var(--radius-md);
  width: 100%;
}

.acu-moe-full__tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--bg-deep);
  border: 1px solid var(--border-cyan-bright);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--cyan-prime);
  white-space: nowrap;
  z-index: 10;
}
```

### Wiring in `app/master-ops/page.tsx`

Add a query-param check that renders MOEMatrixFull in the center canvas when `?dashboard=moe` is set:

```typescript
import { useSearchParams } from 'next/navigation';
import { MOEMatrixFull } from '@/src/components/dashboard/MOEMatrixFull';

// inside the App() component
const searchParams = useSearchParams();
const showMOEFull = searchParams.get('dashboard') === 'moe';

// inside the Dashboard mode render path
{showMOEFull ? <MOEMatrixFull /> : <DefaultSectionContent />}
```

## Doctrinal red-lines

- Reuses Phase 3b `/api/dashboard/moe-stream` SSE channel · no new endpoints
- Stable expert-to-domain mapping (from Phase 3b `EXPERT_DOMAINS`)
- Hover tooltip is pure DOM · no canvas text (cleaner cursor + accessibility)
- SSE stream pauses on tab hidden (canon)
- Domain colors EXACTLY per ACAI V2 canon (6 colors locked)
- Glass panel + tokens (no new design language)

## Tests

### Vitest

`src/components/dashboard/MOEMatrixFull.test.tsx`:

1. Renders header + canvas + (initially no tooltip)
2. EventSource opens on mount
3. EventSource closes on unmount
4. EventSource closes on `document.hidden = true`
5. After SSE message, snapshot state updates
6. Hover updates tooltip state
7. Mouse leave clears tooltip
8. Stats display correct active count
9. Domain swatches use canonical color hex

### Playwright (in `tests/living-interface.spec.ts`)

10. Visit `/master-ops?dashboard=moe` after Alt+D → MOEMatrixFull rendered
11. Hover over a cell → tooltip appears

## Acceptance criteria

- [ ] `MOEMatrixFull.tsx` is ≥ 4000 bytes (NOT empty placeholder anymore)
- [ ] Renders 35×23 grid at canvas size matching container
- [ ] DPR scaling correct on retina displays
- [ ] Hover tooltip shows expert ID, domain, activation strength
- [ ] Domain stats panel shows 6 domain counts
- [ ] SSE stream cleanup on unmount + tab hidden
- [ ] All 11 tests pass
- [ ] Activated by `?dashboard=moe` query string
- [ ] Bundle delta < +4 kB
- [ ] F-13 closed
