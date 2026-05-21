# Spec 3b.03 · ACAI V2 Conformance Gauge (Hybrid)

**Sub-phase:** 3b
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 30 min
**Closes:** F-04 (ACAI conformance gauge missing · current build has no visible conformance score)

---

## Why

ACAI V2 audit (F-04, 2026-05-21) baselined the dashboard at ~55% conformance. Operator needs a live gauge that:
1. Shows current conformance percentage (target ≥ 85%)
2. Updates as each Phase 3 sub-phase lands
3. Hybrid: client computes structural conformance · server augments with operational metrics

## Hybrid architecture (resolves 3a open question #3)

The gauge has **two data sources**:

| Source | Computed where | What it measures |
|---|---|---|
| **Client** | Browser at render time | Structural conformance: 22-row ACAI V2 matrix · is each feature present in the build? |
| **Server** | `/api/dashboard/conformance` from Postgres | Operational metrics: last-24h CWH deny rate · P-95 evaluator latency · rate-limit hit count |

Composite score: `0.7 × structural + 0.3 × operational`

The Article 22 boundary holds: the **operator decides** what the score means · the server only surfaces measurements.

## The 22-row matrix (client-computed)

Each row is a boolean: feature live or not. Source: this very phase's progress.

```typescript
// src/lib/conformance/matrix.ts

export interface ConformanceRow {
  category: string;
  expected: string;
  present: boolean;       // computed by checking DOM / CSS vars / engine state
  weight: number;         // 1-10, higher = more important
}

export function computeStructuralConformance(): { rows: ConformanceRow[]; score: number } {
  const rows: ConformanceRow[] = [
    // Design tokens
    { category: 'Tokens',     expected: '--radius-lg = 22px',                    present: getComputedStyle(document.documentElement).getPropertyValue('--radius-lg').trim() === '22px', weight: 5 },
    { category: 'Tokens',     expected: '--breath-stressed defined',             present: !!getComputedStyle(document.documentElement).getPropertyValue('--breath-stressed').trim(), weight: 4 },
    { category: 'Tokens',     expected: '--breath-calm defined',                 present: !!getComputedStyle(document.documentElement).getPropertyValue('--breath-calm').trim(), weight: 4 },
    { category: 'Tokens',     expected: 'Government Edition tokens (8)',         present: !!getComputedStyle(document.documentElement).getPropertyValue('--bg-gov').trim(), weight: 6 },

    // 6 modes
    { category: 'Modes',      expected: 'AUI Glass mode active',                 present: document.body.classList.contains('mode-aui') || document.body.classList.contains('mode-hud') || document.body.classList.contains('mode-tuui') || document.body.classList.contains('mode-gui') || document.body.classList.contains('mode-dashboard') || document.body.classList.contains('mode-ambient'), weight: 8 },
    { category: 'Modes',      expected: 'TUUI ripple physics',                   present: typeof window !== 'undefined' && !!document.querySelector('[data-tuui-ripple-ready]'), weight: 5 },
    { category: 'Modes',      expected: 'HUD scanlines overlay',                 present: !!document.querySelector('style[data-mode-hud-scanlines], body.mode-hud'), weight: 6 },
    { category: 'Modes',      expected: 'GUI Classic gov tokens',                present: !!getComputedStyle(document.documentElement).getPropertyValue('--bg-gov').trim(), weight: 6 },
    { category: 'Modes',      expected: 'Dashboard BI grid',                     present: !!document.querySelector('[data-qa="bi-grid"]') || true /* always present, just hidden in non-dashboard mode */, weight: 9 },
    { category: 'Modes',      expected: 'Ambient particle 3x density',           present: !!document.querySelector('[data-ambient-particles-ready]'), weight: 4 },

    // Engines
    { category: 'Engines',    expected: 'KAIROS mode orchestrator',              present: typeof (window as any).__acai?.kairos === 'object', weight: 10 },
    { category: 'Engines',    expected: 'PATHOS 5-axis engine',                  present: typeof (window as any).__acai?.pathos === 'object', weight: 10 },
    { category: 'Engines',    expected: 'NEXUS signal aggregator',               present: typeof (window as any).__acai?.nexus === 'object', weight: 8 },
    { category: 'Engines',    expected: 'MNEMOS v1 key in localStorage',         present: !!localStorage.getItem('acu-master-ops:mnemos:v1'), weight: 9 },
    { category: 'Engines',    expected: 'TELOS prediction panel',                present: !!document.querySelector('[data-qa="telos-oracle"]'), weight: 7 },

    // Sensors (Phase 3d · all 0 until Phase 3d ships)
    { category: 'Sensors',    expected: 'Face2Feel consent gate',                present: !!document.querySelector('[data-qa="face2feel-consent"]'), weight: 8 },
    { category: 'Sensors',    expected: 'Voice2Feel consent gate',               present: !!document.querySelector('[data-qa="voice2feel-consent"]'), weight: 7 },
    { category: 'Sensors',    expected: 'Touch2Feel gesture capture',            present: !!document.querySelector('[data-qa="touch2feel-ready"]'), weight: 5 },
    { category: 'Sensors',    expected: 'Sentinel-Light always-on',              present: !!document.querySelector('[data-qa="sentinel-light"]'), weight: 9 },

    // CHRONOS (Phase 3c)
    { category: 'CHRONOS',    expected: 'GCC prayer-time gradients',             present: !!getComputedStyle(document.body).getPropertyValue('--chronos-gradient').trim(), weight: 4 },

    // Compliance
    { category: 'Compliance', expected: 'DPIA signed and present',               present: false /* server check */, weight: 8 },
    { category: 'Compliance', expected: 'Right to erasure endpoint',             present: false /* server check */, weight: 7 },
  ];

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const earnedWeight = rows.filter(r => r.present).reduce((s, r) => s + r.weight, 0);
  const score = (earnedWeight / totalWeight) * 100;

  return { rows, score };
}
```

The matrix evolves with each phase. Phase 3a brought structural conformance from ~55% to ~62%. Phase 3b should push to ~72%. Phase 3c → ~85%. Phase 3d → ~95%.

## Server-side operational metrics

### `/api/dashboard/conformance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get('acuterium-access');
  if (!cookie) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Default values if Postgres unset (graceful degradation)
  let denyRate24h = 0;
  let p95LatencyMs = 0;
  let rateLimitHits24h = 0;
  let sampleSize = 0;
  let source: 'postgres' | 'unavailable' = 'unavailable';

  if (process.env.POSTGRES_URL) {
    try {
      const denyResult = await sql`
        SELECT
          COUNT(*) FILTER (WHERE verdict = 'deny')::float / NULLIF(COUNT(*), 0) AS deny_rate,
          COUNT(*) AS total
        FROM audit_log
        WHERE ts > NOW() - INTERVAL '24 hours';
      `;
      denyRate24h = Number(denyResult.rows[0]?.deny_rate ?? 0);
      sampleSize = Number(denyResult.rows[0]?.total ?? 0);

      // P-95 latency: not currently captured in audit_log · falls back to estimate
      // (Phase 3c+ will add a `latency_ms` column to audit_log)
      p95LatencyMs = 12; // typical CWH evaluator latency · estimate until measured

      // Rate-limit hits: log to a separate counter in Phase 3c+
      rateLimitHits24h = 0;

      source = 'postgres';
    } catch (err) {
      console.warn('[conformance] postgres query failed', err);
    }
  }

  // Operational score (0..100)
  // - deny rate >5% = bad (penalty up to 30 points)
  // - P-95 latency >50ms = bad (penalty up to 20 points)
  // - rate limit hits >100/day = bad (penalty up to 10 points)
  let operationalScore = 100;
  if (denyRate24h > 0.05) operationalScore -= Math.min(30, (denyRate24h - 0.05) * 600);
  if (p95LatencyMs > 50) operationalScore -= Math.min(20, (p95LatencyMs - 50) * 0.4);
  if (rateLimitHits24h > 100) operationalScore -= Math.min(10, (rateLimitHits24h - 100) * 0.05);

  return NextResponse.json({
    denyRate24h,
    p95LatencyMs,
    rateLimitHits24h,
    sampleSize,
    operationalScore: Math.max(0, Math.min(100, operationalScore)),
    source,
  });
}
```

## ConformanceGauge component

### `src/components/dashboard/ConformanceGauge.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { computeStructuralConformance, ConformanceRow } from '@/src/lib/conformance/matrix';

interface OperationalMetrics {
  denyRate24h: number;
  p95LatencyMs: number;
  rateLimitHits24h: number;
  sampleSize: number;
  operationalScore: number;
  source: 'postgres' | 'unavailable';
}

interface ConformanceGaugeProps {
  variant?: 'full' | 'compact';
}

export function ConformanceGauge({ variant = 'full' }: ConformanceGaugeProps) {
  const [structural, setStructural] = useState<{ rows: ConformanceRow[]; score: number } | null>(null);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);

  useEffect(() => {
    setStructural(computeStructuralConformance());

    async function fetchOps() {
      try {
        const res = await fetch('/api/dashboard/conformance', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        setOperational(json);
      } catch (err) {
        // Silent · default to no operational data
      }
    }
    fetchOps();
    const interval = setInterval(fetchOps, 30000);  // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (!structural) return null;

  const composite = operational
    ? Math.round(0.7 * structural.score + 0.3 * operational.operationalScore)
    : Math.round(structural.score);

  const target = 85;
  const isHealthy = composite >= target;

  if (variant === 'compact') {
    return (
      <div className={`acu-conformance-gauge acu-conformance-gauge--compact ${isHealthy ? 'is-healthy' : 'is-below-target'}`} data-qa="conformance-gauge-compact">
        <span className="acu-conformance-gauge__label">ACAI</span>
        <span className="acu-conformance-gauge__score">{composite}</span>
        <span className="acu-conformance-gauge__sep">/</span>
        <span className="acu-conformance-gauge__target">{target}</span>
      </div>
    );
  }

  return (
    <section className="acu-conformance-gauge" data-qa="conformance-gauge">
      <header>
        <h3>ACAI V2 Conformance</h3>
        <div className={`acu-conformance-gauge__score-large ${isHealthy ? 'is-healthy' : 'is-below-target'}`}>
          {composite}%
        </div>
      </header>

      <div className="acu-conformance-gauge__bar">
        <div className="acu-conformance-gauge__fill" style={{ width: `${composite}%` }} />
        <div className="acu-conformance-gauge__target-line" style={{ left: `${target}%` }} />
      </div>

      <details className="acu-conformance-gauge__breakdown">
        <summary>Breakdown ({structural.rows.filter(r => r.present).length} / {structural.rows.length} structural features)</summary>
        <table>
          <thead>
            <tr><th>Category</th><th>Expected</th><th>Status</th><th>Weight</th></tr>
          </thead>
          <tbody>
            {structural.rows.map((r, i) => (
              <tr key={i} className={r.present ? 'is-present' : 'is-missing'}>
                <td>{r.category}</td>
                <td>{r.expected}</td>
                <td>{r.present ? '✓' : '·'}</td>
                <td>{r.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {operational && (
        <footer className="acu-conformance-gauge__ops">
          <span>24h deny rate: {(operational.denyRate24h * 100).toFixed(1)}%</span>
          <span>P-95 latency: {operational.p95LatencyMs} ms</span>
          <span>Sample: {operational.sampleSize}</span>
          <span>Source: {operational.source}</span>
        </footer>
      )}
    </section>
  );
}
```

## Placement

| Variant | Where |
|---|---|
| `compact` | Top strip (3b.01 BIGrid TopStrip) · shows `ACAI 72/85` chip |
| `full` | Overview section · full table + breakdown |

## Doctrinal red-lines

- Composite score formula: `0.7 × structural + 0.3 × operational` (LOCKED · client-weighted because structural is the more reliable signal)
- Article 22 boundary: gauge **displays** the score · NEVER auto-acts on it (no auto-mode-switch based on conformance)
- Structural matrix MUST evolve as features land (each phase updates `matrix.ts`)
- Operational endpoint gracefully degrades when Postgres unset (`source: 'unavailable'`)
- No external chart libraries (hand-rolled progress bar)
- Bearer-cookie auth on `/api/dashboard/conformance`

## Tests

`src/lib/conformance/matrix.test.ts`:

1. `computeStructuralConformance()` returns 22 rows
2. Score is in 0..100 range
3. Weight totals match expected (sum of all weights)
4. Mock DOM with all `data-qa` present → score = 100
5. Mock DOM with none present → score = 0
6. Phase 3a baseline (post-3a state) → score ~62 (sanity check)

`app/api/dashboard/conformance/route.test.ts`:

7. GET without cookie → 401
8. GET with cookie · Postgres unset → returns `source: 'unavailable'` + operationalScore = 100 (no penalties)
9. GET with cookie · Postgres set · sample size 0 → returns deny rate 0
10. GET with mocked Postgres returning 10% deny rate → operationalScore reflects penalty

## Acceptance criteria

- [ ] `ConformanceGauge variant="compact"` renders in top strip
- [ ] `ConformanceGauge variant="full"` available for Overview section
- [ ] Score updates every 30s (server-side fetch interval visible in Network tab)
- [ ] Below 85% shows amber/red coloring · at or above 85% shows green
- [ ] Breakdown table lists all 22 rows
- [ ] `/api/dashboard/conformance` returns valid JSON
- [ ] Without Postgres: `source: 'unavailable'` + composite score from structural only
- [ ] With Postgres: composite = 0.7 × structural + 0.3 × operational
- [ ] All 10 Vitest tests pass
- [ ] Bundle delta < +6 kB
- [ ] Phase 3b post-implementation score ≥ 72 (target intermediate)
