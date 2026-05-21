# Spec 3b.01 · Dashboard Mode BI Grid Layout

**Sub-phase:** 3b
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 60 min
**Closes:** F-03 (Dashboard mode is dense-AUI not a BI grid) · part of F-04 (Dashboard mode conformance)

---

## Why

Phase 1E left Dashboard mode as 10 CSS overrides that just shrink padding/font-size. ACAI V2 canon defines Mode 5 (Dashboard) as a real BI grid: left rail · top strip · center canvas · right rail. Operator (Dr. Jay) directly observed and flagged this on 2026-05-21.

## Out of scope (deferred to Phase 3c/3d)

- CHRONOS gradient adaptation (Phase 3c)
- Sentinel-Light dots (Phase 3d sensor work)
- Real-time DIARAN-MOE wiring (this spec uses simulated activations · spec 3b.02)

## Layout contract

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP STRIP (60 px)                                                   │
│  AcuteriumLogo · brand · 8 section pills · doctrine gauge ·          │
│  composite score · LIVE/PWA/RESET chips                              │
├──────────┬───────────────────────────────────────────┬───────────────┤
│          │                                           │               │
│  LEFT    │                                           │   RIGHT       │
│  RAIL    │              CENTER CANVAS                │   RAIL        │
│ 240 px   │             (flex-grow)                   │   300 px      │
│          │                                           │               │
│  PATHOS  │   Active section content rendered in      │   TELOS       │
│  5-axis  │   dashboard density:                      │   Intent      │
│  sidebar │   - Overview · Tasks · Milestones · etc.  │   Oracle      │
│          │   - Tables, charts, lists                 │   (top)       │
│  KAIROS  │   - Conformance gauge embedded            │               │
│  mode    │                                           │   MOE         │
│  mini    │                                           │   Expert      │
│  pills   │                                           │   Matrix      │
│          │                                           │   mini-view   │
│  Session │                                           │   (middle)    │
│  counter │                                           │               │
│          │                                           │   AuditLog    │
│          │                                           │   tail        │
│          │                                           │   (bottom)    │
│          │                                           │               │
└──────────┴───────────────────────────────────────────┴───────────────┘
```

## Breakpoints

| Width | Layout |
|---|---|
| **≥1280 px** | 3-rail (full BI grid as above) |
| **768-1279 px** | Left + right rails collapse to drawers; toggleable via top-strip icons; center canvas full width |
| **<768 px** | Single column; rails hidden; switch back to Overview-style layout (BI grid is desktop-only) |

## Activation

`body.mode-dashboard` triggers the entire BI grid layout. Other 5 modes (AUI · TUUI · HUD · GUI · Ambient) are completely untouched by this spec.

## Files to create

### `src/components/dashboard/BIGrid.tsx`

The orchestrator component. Renders the 3-rail layout when `mode === 'dashboard'`, otherwise renders children directly.

```typescript
'use client';

import { ReactNode } from 'react';
import { LeftRail } from './LeftRail';
import { TopStrip } from './TopStrip';
import { RightRail } from './RightRail';

export interface BIGridProps {
  mode: string;
  children: ReactNode;
}

export function BIGrid({ mode, children }: BIGridProps) {
  if (mode !== 'dashboard') return <>{children}</>;

  return (
    <div className="acu-bi-grid" data-qa="bi-grid">
      <TopStrip />
      <div className="acu-bi-grid__body">
        <LeftRail />
        <main className="acu-bi-grid__center">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}
```

### `src/components/dashboard/LeftRail.tsx`

```typescript
'use client';

import { usePathos } from '../../engines/pathos';
import { useKairos } from '../../engines/kairos';
import { useMnemos } from '../../engines/mnemos';

export function LeftRail() {
  const pathos = usePathos();
  const { mode, setMode } = useKairos();
  const { sessionCount } = useMnemos();

  return (
    <aside className="acu-bi-grid__left-rail" data-qa="left-rail">
      <section className="acu-pathos-sidebar" data-qa="pathos-sidebar">
        <h3>PATHOS</h3>
        <PathosAxis label="Stress"        value={pathos.stress} />
        <PathosAxis label="Focus"         value={pathos.focus} />
        <PathosAxis label="Curiosity"     value={pathos.curiosity} />
        <PathosAxis label="Fatigue"       value={pathos.fatigue} />
        <PathosAxis label="Satisfaction"  value={pathos.satisfaction} />
      </section>

      <section className="acu-kairos-mini" data-qa="kairos-mini">
        <h3>KAIROS</h3>
        <div className="acu-kairos-mini__pills">
          {(['aui','hud','tuui','gui','dashboard','ambient'] as const).map(m =>
            <button
              key={m}
              className={`acu-kairos-mini__pill ${mode === m ? 'is-active' : ''}`}
              onClick={() => setMode(m)}
              data-qa={`mode-pill-${m}`}
            >
              {m.toUpperCase()}
            </button>
          )}
        </div>
      </section>

      <section className="acu-session-counter" data-qa="session-counter">
        <span className="acu-session-counter__label">SESSION</span>
        <span className="acu-session-counter__value">#{sessionCount}</span>
      </section>
    </aside>
  );
}

function PathosAxis({ label, value }: { label: string; value: number }) {
  return (
    <div className="acu-pathos-axis">
      <span className="acu-pathos-axis__label">{label}</span>
      <div className="acu-pathos-axis__bar">
        <div className="acu-pathos-axis__fill" style={{ width: `${value}%` }} />
      </div>
      <span className="acu-pathos-axis__value">{Math.round(value)}</span>
    </div>
  );
}
```

### `src/components/dashboard/TopStrip.tsx`

```typescript
'use client';

import { AcuteriumLogo } from '../brand/AcuteriumLogo';
import { ConformanceGauge } from './ConformanceGauge'; // from spec 3b.03
import { SectionPills } from './SectionPills';
import { StatusChips } from './StatusChips';

export function TopStrip() {
  return (
    <header className="acu-bi-grid__top-strip" data-qa="top-strip">
      <div className="acu-top-strip__brand">
        <AcuteriumLogo size={32} />
        <span className="acu-top-strip__brand-text">ACUTERIUM · MASTER OPS</span>
      </div>

      <nav className="acu-top-strip__sections">
        <SectionPills />
      </nav>

      <div className="acu-top-strip__metrics">
        <ConformanceGauge variant="compact" />
      </div>

      <div className="acu-top-strip__status">
        <StatusChips />
      </div>
    </header>
  );
}
```

### `src/components/dashboard/RightRail.tsx`

```typescript
'use client';

import { TelosOraclePanel } from './TelosOraclePanel';
import { MOEMatrixMini } from './MOEMatrixMini'; // from spec 3b.02
import { AuditLogTail } from './AuditLogTail';

export function RightRail() {
  return (
    <aside className="acu-bi-grid__right-rail" data-qa="right-rail">
      <section className="acu-telos-oracle-panel" data-qa="telos-oracle">
        <h3>TELOS · Intent Oracle</h3>
        <TelosOraclePanel />
      </section>

      <section className="acu-moe-mini" data-qa="moe-mini">
        <h3>MOE · Expert Matrix</h3>
        <MOEMatrixMini />
      </section>

      <section className="acu-auditlog-tail" data-qa="auditlog-tail">
        <h3>Audit Log · Live Tail</h3>
        <AuditLogTail />
      </section>
    </aside>
  );
}
```

### `src/components/dashboard/AuditLogTail.tsx`

Lightweight tail of last 10 audit entries from Postgres (with JSONL fallback if Postgres unset).

```typescript
'use client';

import { useEffect, useState } from 'react';

interface AuditEntry {
  auditId: string;
  timestamp: string;
  target: string;
  verdict: string;
  ruleId: string;
}

export function AuditLogTail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTail() {
      try {
        const res = await fetch('/api/auditlog/tail?limit=10', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (json.entries) setEntries(json.entries);
      } catch (err) {
        // Silent · this is a passive read panel
      }
    }
    fetchTail();
    const interval = setInterval(fetchTail, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <ul className="acu-auditlog-tail__list">
      {entries.map(e => (
        <li key={e.auditId} className={`acu-auditlog-tail__item is-${e.verdict}`}>
          <span className="acu-auditlog-tail__time">{new Date(e.timestamp).toLocaleTimeString()}</span>
          <span className="acu-auditlog-tail__target">{e.target}</span>
          <span className="acu-auditlog-tail__rule">{e.ruleId}</span>
        </li>
      ))}
    </ul>
  );
}
```

### `app/api/auditlog/tail/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { readJsonlTail } from '@/src/lib/cwh/auditlog';

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get('acuterium-access');
  if (!cookie) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 10), 50);

  // Try Postgres first
  if (process.env.POSTGRES_URL) {
    try {
      const result = await sql`
        SELECT audit_id, ts, target, verdict, rule_id
        FROM audit_log
        ORDER BY ts DESC
        LIMIT ${limit};
      `;
      return NextResponse.json({
        entries: result.rows.map(r => ({
          auditId: r.audit_id,
          timestamp: r.ts,
          target: r.target,
          verdict: r.verdict,
          ruleId: r.rule_id,
        })),
        source: 'postgres',
      });
    } catch (err) {
      console.warn('[auditlog/tail] postgres failed, falling back to JSONL', err);
    }
  }

  // Fallback to JSONL
  const entries = await readJsonlTail(limit);
  return NextResponse.json({ entries, source: 'jsonl' });
}
```

### CSS file · `src/styles/bi-grid.css`

Imported by `app/master-ops/page.tsx` alongside existing styles.

```css
/* ============================================
 * BI Grid Layout · Dashboard mode only
 * ============================================ */

body.mode-dashboard .acu-bi-grid {
  display: grid;
  grid-template-rows: 60px 1fr;
  min-height: 100vh;
}

body.mode-dashboard .acu-bi-grid__body {
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
}

body.mode-dashboard .acu-bi-grid__top-strip {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: var(--glass-void);
  backdrop-filter: blur(24px) saturate(200%);
  border-bottom: 1px solid var(--border-cyan-mid);
}

body.mode-dashboard .acu-bi-grid__left-rail,
body.mode-dashboard .acu-bi-grid__right-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  background: var(--glass-panel);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-lg);
  padding: 16px;
}

body.mode-dashboard .acu-bi-grid__center {
  overflow-y: auto;
  background: var(--glass-item);
  border-radius: var(--radius-lg);
  padding: 20px;
}

/* PATHOS sidebar */
body.mode-dashboard .acu-pathos-axis {
  display: grid;
  grid-template-columns: 80px 1fr 28px;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 4px 0;
}

body.mode-dashboard .acu-pathos-axis__bar {
  height: 4px;
  background: rgba(0, 229, 212, 0.08);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

body.mode-dashboard .acu-pathos-axis__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan-prime), var(--cyan-bright));
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* KAIROS mini pills */
body.mode-dashboard .acu-kairos-mini__pills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

body.mode-dashboard .acu-kairos-mini__pill {
  background: transparent;
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 1.5px;
  padding: 4px 6px;
  cursor: pointer;
  text-transform: uppercase;
}

body.mode-dashboard .acu-kairos-mini__pill.is-active {
  background: rgba(0, 229, 212, 0.10);
  border-color: var(--border-cyan-bright);
  color: var(--cyan-prime);
}

/* AuditLog tail */
body.mode-dashboard .acu-auditlog-tail__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
}

body.mode-dashboard .acu-auditlog-tail__item {
  display: grid;
  grid-template-columns: 64px 1fr 60px;
  gap: 6px;
  padding: 4px 6px;
  border-left: 2px solid;
  border-radius: var(--radius-sm);
}

body.mode-dashboard .acu-auditlog-tail__item.is-allow { border-left-color: var(--green-ok); }
body.mode-dashboard .acu-auditlog-tail__item.is-deny  { border-left-color: var(--red-alert); }

/* ─── BREAKPOINTS ─── */

/* Tablet: rails collapse to drawers */
@media (max-width: 1279px) and (min-width: 768px) {
  body.mode-dashboard .acu-bi-grid__body {
    grid-template-columns: 1fr;
  }
  body.mode-dashboard .acu-bi-grid__left-rail,
  body.mode-dashboard .acu-bi-grid__right-rail {
    position: fixed;
    top: 60px;
    bottom: 0;
    width: 280px;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  body.mode-dashboard .acu-bi-grid__left-rail { left: 0; }
  body.mode-dashboard .acu-bi-grid__right-rail { right: 0; transform: translateX(100%); }
  body.mode-dashboard .acu-bi-grid__left-rail.is-open { transform: translateX(0); }
  body.mode-dashboard .acu-bi-grid__right-rail.is-open { transform: translateX(0); }
}

/* Mobile: hide rails entirely, fall back to Overview-style center column */
@media (max-width: 767px) {
  body.mode-dashboard .acu-bi-grid__left-rail,
  body.mode-dashboard .acu-bi-grid__right-rail {
    display: none;
  }
  body.mode-dashboard .acu-bi-grid__body {
    grid-template-columns: 1fr;
  }
}
```

## Files to modify

### `app/master-ops/page.tsx`

Wrap the existing section content in `<BIGrid>`:

```typescript
import { BIGrid } from '@/src/components/dashboard/BIGrid';
import '@/src/styles/bi-grid.css';

// inside the App() component
return (
  <BIGrid mode={kairosMode}>
    {/* existing section content */}
  </BIGrid>
);
```

Existing PATHOS sidebar, top nav, etc. that lived in `master-ops/page.tsx` need to be:
- Removed from page.tsx when in Dashboard mode (because BIGrid renders its own top strip)
- Preserved for other modes (BIGrid renders children directly when mode != 'dashboard')

The cleanest pattern: wrap the page in `<BIGrid mode={mode}>` and conditionally render the existing in-page nav based on `mode !== 'dashboard'`.

## Doctrinal red-lines

- BI grid layout ACTIVE ONLY when `body.mode-dashboard` (no leakage to other modes)
- Glass transparency on rails stays 45-55% (uses existing tokens)
- AuditLog tail panel writes NOTHING · read-only
- AuditLog tail respects `document.visibilitychange` (pause polling when tab hidden)
- No new external dependencies (no react-grid-layout, no flexbox-grid library)
- All new selectors get base CSS rules BEFORE `body.mode-dashboard` overrides (preflight 7.16)

## Tests

### Vitest

`src/components/dashboard/BIGrid.test.tsx`:

1. `<BIGrid mode="aui">` renders children directly (no wrapper)
2. `<BIGrid mode="dashboard">` renders TopStrip, LeftRail, center main, RightRail
3. `<LeftRail>` shows all 5 PATHOS axes in canon order
4. `<RightRail>` shows TELOS oracle, MOE mini, AuditLog tail in that order
5. Mode-switch from dashboard to aui unmounts BIGrid wrapper cleanly

`app/api/auditlog/tail/route.test.ts`:

6. GET without cookie → 401
7. GET with cookie + Postgres available → returns Postgres rows
8. GET with cookie + Postgres unset → returns JSONL fallback
9. GET with limit=100 → capped at 50

## Acceptance criteria

- [ ] `<BIGrid>` component renders 3-rail layout in Dashboard mode
- [ ] Left rail shows PATHOS 5-axis sidebar in canon order
- [ ] Right rail shows TELOS + MOE + AuditLog tail
- [ ] Top strip shows logo + section pills + conformance gauge + status chips
- [ ] Center canvas renders existing section content
- [ ] At 1280+ px: 3 rails visible
- [ ] At 768-1279 px: rails collapse to drawers with toggle
- [ ] At <768 px: rails hidden, single column
- [ ] Switching out of Dashboard mode restores original layout cleanly
- [ ] AuditLog tail updates every 5s (visible in DevTools Network)
- [ ] AuditLog tail uses Postgres if available, JSONL fallback otherwise
- [ ] Bundle delta < +25 kB (largest item in 3b)
- [ ] All 9 Vitest tests pass
- [ ] Preflight 7.16 verified (base CSS before mode-dashboard overrides)
- [ ] Preflight 7.18 verified (BI grid has independent left/right rails)
