# Spec 3b.02 · MOE Expert Matrix Canvas

**Sub-phase:** 3b
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 45 min
**Closes:** Part of F-04 (Dashboard mode ACAI conformance · MOE matrix was 0%)

---

## Why

ACAI V2 canon defines Mode 5 (Dashboard) as featuring the **MOE Expert Activation Matrix** — a live 785-node canvas grid showing DIARAN-MOE expert activation state across 6 domain colors. The current build implements none of this. Phase 3b lands the renderer with simulated activations · real DIARAN-MOE wiring is deferred to Phase 4+ (requires Baranurion-Core integration).

## Out of scope (Phase 4+)

- Real DIARAN-MOE expert telemetry wiring (Baranurion-Core needed)
- Per-expert click-through (drill into expert routing decisions)
- Historical activation playback

## Visual contract

- **785 expert nodes** arranged in **35 columns × 23 rows** grid (805 cells · 20 trailing cells stay inactive)
- **6 domain colors:**
  - `language` → `#00E5D4` (cyan-prime)
  - `reasoning` → `#7B68EE` (violet-qenc)
  - `code` → `#30D158` (green-ok)
  - `legal` → `#C9A84C` (gold-prime)
  - `finance` → `#FF6B35` (amber-warm)
  - `security` → `#FF3B30` (red-alert)
- **Activation strength** 0.0–1.0 maps to alpha 0.2–1.0
- Inactive cells show as `rgba(0, 229, 212, 0.04)` ghost squares
- Cell border 0.5 px in domain color when active

## Two renders

### Mini (right rail · always visible in Dashboard mode)

- Canvas 280 × 140 px
- 5 px per cell
- Renders at 5 Hz from SSE channel

### Full (center canvas · activated by `?dashboard=moe` query)

- Canvas 1000 × 600 px (or 90 % viewport · whichever smaller)
- ~28 px per cell · hover shows expert ID tooltip
- Renders at 10 Hz

## Data channel

**5-second SSE stream from `/api/dashboard/moe-stream`** — Server-Sent Events because:
- One-way push, simpler than WebSocket
- Reconnects automatically
- No upgrade negotiation
- Works through Vercel's serverless edge (no WS needed)

## Files to create

### `src/lib/moe/types.ts`

```typescript
export type ExpertDomain = 'language' | 'reasoning' | 'code' | 'legal' | 'finance' | 'security';

export interface ExpertNode {
  id: number;             // 0..784
  domain: ExpertDomain;
  layer: number;          // routing layer (0..7)
  active: boolean;
  activationStrength: number;  // 0.0..1.0
}

export interface MOESnapshot {
  timestamp: string;
  experts: ExpertNode[];  // length 785
  totalActive: number;
  domainCounts: Record<ExpertDomain, number>;
}
```

### `src/lib/moe/seed.ts`

Static seed defining domain assignment per expert ID (so the same expert always belongs to the same domain across snapshots).

```typescript
import { ExpertDomain } from './types';

// Domain distribution per ACAI V2 canon: language-heavy, then reasoning, then code, then specialized
const DOMAIN_RATIOS: Array<[ExpertDomain, number]> = [
  ['language',  220],
  ['reasoning', 180],
  ['code',      140],
  ['legal',     100],
  ['finance',   90],
  ['security',  55],
];

const TOTAL = DOMAIN_RATIOS.reduce((s, [, n]) => s + n, 0);
if (TOTAL !== 785) throw new Error(`MOE domain ratios sum to ${TOTAL}, expected 785`);

export const EXPERT_DOMAINS: ExpertDomain[] = (() => {
  const arr: ExpertDomain[] = [];
  for (const [domain, count] of DOMAIN_RATIOS) {
    for (let i = 0; i < count; i++) arr.push(domain);
  }
  // Fisher-Yates shuffle with a fixed seed so the visual layout is stable across reloads
  let seed = 0xACE7E40;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
})();
```

### `src/lib/moe/simulate.ts`

Simulator that produces realistic-looking activation snapshots until real DIARAN-MOE wires up.

```typescript
import { EXPERT_DOMAINS } from './seed';
import { ExpertNode, MOESnapshot, ExpertDomain } from './types';

// Stable PRNG so consecutive snapshots look like coherent inference, not noise
let prngSeed = 0xACE7E40;
function nextRandom() {
  prngSeed = (prngSeed * 1664525 + 1013904223) & 0xffffffff;
  return (prngSeed >>> 0) / 0xffffffff;
}

let cumulativeActivations: number[] = new Array(785).fill(0);

export function simulateMOESnapshot(): MOESnapshot {
  // Each tick activates ~120-180 experts (real MOE-Heavy uses ~150 of 785)
  const targetActive = 120 + Math.floor(nextRandom() * 60);
  const experts: ExpertNode[] = [];

  for (let i = 0; i < 785; i++) {
    const r = nextRandom();
    const active = cumulativeActivations[i] * 0.5 + r < (targetActive / 785) * 1.8;
    const activationStrength = active ? 0.3 + nextRandom() * 0.7 : 0;
    cumulativeActivations[i] = active ? cumulativeActivations[i] * 0.7 + 0.3 : cumulativeActivations[i] * 0.5;
    experts.push({
      id: i,
      domain: EXPERT_DOMAINS[i],
      layer: i % 8,
      active,
      activationStrength,
    });
  }

  const totalActive = experts.filter(e => e.active).length;
  const domainCounts: Record<ExpertDomain, number> = {
    language: 0, reasoning: 0, code: 0, legal: 0, finance: 0, security: 0,
  };
  for (const e of experts) if (e.active) domainCounts[e.domain]++;

  return {
    timestamp: new Date().toISOString(),
    experts,
    totalActive,
    domainCounts,
  };
}
```

### `src/components/dashboard/MOEMatrixMini.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { ExpertNode, ExpertDomain } from '@/src/lib/moe/types';

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
const W = 280;
const H = 140;

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
      es = new EventSource('/api/dashboard/moe-stream');
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const snapshot = JSON.parse(ev.data);
          render(ctx!, snapshot.experts);
        } catch (err) {
          // Silent
        }
      };
      es.onerror = () => {
        // EventSource auto-reconnects · just close on visibility change
        if (document.hidden && es) { es.close(); es = null; }
      };
    }

    function handleVisibility() {
      if (document.hidden) {
        if (es) { es.close(); es = null; }
      } else {
        if (!es) connect();
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

  return <canvas ref={canvasRef} width={W} height={H} data-qa="moe-matrix-mini" />;
}

function render(ctx: CanvasRenderingContext2D, experts: ExpertNode[]) {
  ctx.clearRect(0, 0, W, H);

  const cellW = W / COLS;
  const cellH = H / ROWS;

  for (let i = 0; i < experts.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * cellW;
    const y = row * cellH;
    const e = experts[i];

    if (e.active) {
      ctx.fillStyle = DOMAIN_COLORS[e.domain];
      ctx.globalAlpha = 0.2 + e.activationStrength * 0.8;
      ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(0, 229, 212, 0.04)';
      ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }
  }
}
```

### `src/components/dashboard/MOEMatrixFull.tsx`

Same renderer, larger canvas, mounted at `/master-ops?dashboard=moe`. Hover overlay shows expert ID + domain.

### `app/api/dashboard/moe-stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { simulateMOESnapshot } from '@/src/lib/moe/simulate';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get('acuterium-access');
  if (!cookie) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let cancelled = false;

      function push() {
        if (cancelled) return;
        const snapshot = simulateMOESnapshot();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      }

      // Initial snapshot immediately, then every 5s
      push();
      const interval = setInterval(push, 5000);

      req.signal.addEventListener('abort', () => {
        cancelled = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

## Files to modify

### `middleware.ts`

Add `/api/dashboard/moe-stream` to the bearer-cookie protected matcher (already covered by general `/api/*` rule but verify SSE doesn't break the cookie check).

### Postgres migration (optional · phase 3b)

If real DIARAN-MOE wiring lands in v1.5, snapshots will be persisted. Pre-emptively create the table:

```sql
-- migrations/2026-05-21-002-moe-state.sql

CREATE TABLE IF NOT EXISTS moe_state (
  snapshot_id     TEXT PRIMARY KEY,        -- ULID with moe_ prefix
  ts              TIMESTAMPTZ NOT NULL,
  total_active    INTEGER NOT NULL,
  domain_counts   JSONB NOT NULL,
  experts         JSONB NOT NULL,           -- full 785-node snapshot
  channel         TEXT NOT NULL DEFAULT 'simulator',  -- 'simulator' | 'diaran-moe-real'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moe_state_ts ON moe_state (ts DESC);
```

In Phase 3b this migration is created but the simulator does NOT write to Postgres (would generate ~17K rows/day). Real DIARAN-MOE will write.

## Doctrinal red-lines

- 785 expert nodes EXACTLY (canon)
- 6 domain colors EXACTLY (no shortening, no aliases)
- 35 cols × 23 rows grid layout EXACTLY
- SSE channel is independent from Sheets polling (preflight 7.19)
- SSE channel pauses on `document.visibilitychange` (no zombie streams)
- No external chart libraries (hand-rolled canvas only)
- Stable domain assignment per expert (fixed-seed shuffle)
- Simulator is clearly labeled (channel='simulator' in any persisted snapshot)
- Real DIARAN-MOE wiring is Phase 4+ work · not snuck into 3b

## Tests

### Vitest

`src/lib/moe/seed.test.ts`:

1. `EXPERT_DOMAINS.length === 785`
2. Domain count per `DOMAIN_RATIOS` (220 lang / 180 reasoning / etc.) — verify each via filter+count
3. Fixed seed produces same array across runs

`src/lib/moe/simulate.test.ts`:

4. `simulateMOESnapshot()` produces snapshot with 785 experts
5. `totalActive` count matches actual active filter
6. `domainCounts` sums to `totalActive`
7. Consecutive snapshots show realistic decay (no 0%→100% jumps)

`src/components/dashboard/MOEMatrixMini.test.tsx`:

8. Canvas dimensions are 280 × 140
9. EventSource is closed when component unmounts
10. EventSource is closed when `document.hidden = true`

### Playwright

Visual regression captures the MOE mini in the right rail at Dashboard mode (covered by `tests/dashboard-mode.spec.ts`).

## Acceptance criteria

- [ ] 785 nodes render in mini canvas (visual confirmation via DevTools inspector + browser screenshot)
- [ ] 6 distinct domain colors visible
- [ ] SSE delivers new snapshot every ~5s (Network tab confirms)
- [ ] Component unmounts cleanly when switching out of Dashboard mode
- [ ] SSE stream pauses when tab hidden (Network tab confirms)
- [ ] Full-mode canvas activates at `?dashboard=moe` query
- [ ] Domain counts sum to `totalActive`
- [ ] Postgres `moe_state` table migration runs idempotently
- [ ] All 10 Vitest tests pass
- [ ] Bundle delta < +10 kB (canvas + SSE is light)
- [ ] Preflight 7.19 (SSE separate from Sheets polling) verified via grep
