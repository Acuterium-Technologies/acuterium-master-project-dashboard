# Phase 3b · Dashboard mode BI grid + write-back UI

**Status:** Approved · ready for implementation
**Baseline:** `v1.5.0-alpha.1` (commit `80f6366` + follow-up `1711b03`)
**Target tag:** `v1.5.0-alpha.2`
**Estimated wall time:** 2 to 3 hours
**Iron Rule:** Claude on `main`, no Codex in parallel

---

## What Phase 3b closes

- **F-03** · Dashboard mode is dense-AUI not a BI grid → resolved by P3.1 + P3.2
- **F-04** (Dashboard mode item: 15% conformant) → ~90% after P3.1 + P3.2
- **F-04** (ACAI conformance gauge missing) → resolved by P3.3
- **Phase 3a deferred** · operator write-back UI was punted to 3b → resolved by P3.4

## Operator-facing answers to 3a Open Questions

| Q | Answer (locked in sub-specs below) |
|---|---|
| 1 · BI grid breakpoints | Three breakpoints: ≥1280 px (3-rail) · 768-1279 px (rails collapse to drawers) · <768 px (single column · rails hidden) |
| 2 · MOE matrix update frequency | Independent 5s SSE channel (NOT shared with 30s Sheets poll · spec 3b.02) |
| 3 · ACAI gauge data source | **Both** · client computes 22-row conformance from `state` + server augments with last-24h deny rate + P-95 evaluator latency from Postgres (3b.03 details the hybrid) |
| 4 · Postgres connection target | Stay on Vercel Postgres for v1.5 (Neon under the hood) · revisit sovereign migration in v1.6 |
| 5 · Blob retention sweeper | New cron at `/api/cron/sweep-blob` runs daily 03:00 UTC · deletes Blob entries older than 730 days (spec 3b.05 follow-up · NOT in main 3b scope but task filed) |

---

## Phase 3b scope · 4 sub-specs + Playwright

| # | Spec file | Title | Time |
|---|---|---|---|
| 1 | `01-bi-grid-layout.md` | Dashboard mode left/right rails + top strip + center canvas | 60 min |
| 2 | `02-moe-expert-matrix.md` | 785-node canvas grid · 6 domain colors · 5s SSE | 45 min |
| 3 | `03-acai-conformance-gauge.md` | Hybrid client+server gauge · 22-row matrix · target ≥85% | 30 min |
| 4 | `04-writeback-drawer.md` | Right-side edit drawer · uses Phase 3a `/api/sheets/update` | 45 min |
| 5 | `tests/dashboard-mode.spec.ts` | Playwright captures Dashboard mode at 5 viewports | 15 min |

Total: ~3 hours of focused work.

---

## Preflight matrix (19 rules — adds rule 7.18 + 7.19 to Phase 3a's 17)

| # | Rule | Notes |
|---|---|---|
| 7.1 | Zero Manus references in `src/`, `app/`, `data/` | Carry from 3a |
| 7.2 | Zero TODO / FIXME / placeholder in new files | Carry |
| 7.3 | 12 CWH rule IDs preserved | Carry |
| 7.4 | Target enum 4 base + 6 update variants | Carry |
| 7.5 | 6 valid kairosMode values | Carry |
| 7.6 | PATHOS axis order | Carry |
| 7.7 | Leak-fix middleware not regressed | Carry |
| 7.8 | Bearer-cookie on all new endpoints | Includes `/api/dashboard/conformance` + `/api/dashboard/moe-stream` |
| 7.9 | Rate-limit 429 + Retry-After | Carry |
| 7.10 | `npm run typecheck` clean | |
| 7.11 | `npm run lint` clean | |
| 7.12 | `npm run test` all green | 68 from 3a + ~25 new from 3b |
| 7.13 | Bundle delta < +40 kB first-load | Larger budget than 3a · MOE matrix renderer is the heaviest item |
| 7.14 | AuditLog writes to JSONL + Postgres | Carry · MOE state changes log to audit too |
| 7.15 | Client preview verdict = server verdict | Carry |
| 7.16 | **base-CSS-before-override (LOAD-BEARING this phase)** | Heavy CSS work for BI grid |
| 7.17 | Postgres migration idempotent | Carry · 3b adds 2 new migrations (conformance + moe_state) |
| 7.18 | **Dashboard mode BI grid has independent left/right rails** | structural grep check |
| 7.19 | **SSE channel for MOE matrix is separate from Sheets polling** | grep for EventSource on `/api/dashboard/moe-stream` |

---

## Doctrinal red-lines

- 12 CWH rule IDs preserved exactly
- New `/api/dashboard/*` endpoints all bearer-cookie auth-gated
- SSE channel respects `document.visibilitychange` (pause stream when tab hidden)
- MOE matrix renderer is hand-rolled canvas (NO external chart library)
- Conformance gauge hybrid: client-computed AND server-augmented · NEVER server-only (Article 22 boundary — server doesn't auto-decide doctrine score for operator)
- Write-back drawer uses Phase 3a `/api/sheets/update` endpoint only · NO new write paths
- Glass transparency 45-55%
- Diacritics preserved
- Zero external chart libraries · zero Google Fonts CDN at runtime
- Leak-fix middleware never regresses
- D-09 Manus quarantine intact
- MNEMOS key `acu-master-ops:mnemos:v1` locked
- Iron Rule: Claude on main only, no Codex in parallel

---

## Implementation order (dependency-aware)

1. **3b.03 conformance gauge first** (no new UI surface · easiest derisk)
2. **3b.01 BI grid layout** (foundation for everything else in Dashboard mode)
3. **3b.02 MOE matrix** (lives inside the new BI grid right rail · needs grid first)
4. **3b.04 writeback drawer** (lives inside any section · needs BI grid first for proper docking)
5. **Playwright dashboard-mode.spec.ts** (visual regression for the whole Dashboard mode)

---

## Commit message template

```
Phase 3b · Dashboard mode BI grid + write-back UI

- BI grid layout: 240px left rail (PATHOS sidebar) + 60px top strip + center + 300px right rail (TELOS + MOE)
- MOE Expert Matrix: 785-node canvas grid · 6 domain colors · 5s SSE channel
- ACAI conformance gauge: 22-row client-computed + last-24h deny rate + P-95 evaluator latency from Postgres
- Write-back drawer: edit pencil on task/milestone/OD/KPI rows · POSTs via Phase 3a /api/sheets/update
- Playwright dashboard-mode.spec.ts (5 viewports)
- Postgres migrations: conformance_snapshot + moe_state tables

Closes Phase 3b of v1.5 roadmap.
Closes F-03 (Dashboard mode is now a proper BI grid).
Resolves F-04 Dashboard mode conformance (15% → ~90%).
Postmortem rule 7.16 LOAD-BEARING this phase (CSS-heavy).

Refs:
- specs/3b/01-bi-grid-layout.md
- specs/3b/02-moe-expert-matrix.md
- specs/3b/03-acai-conformance-gauge.md
- specs/3b/04-writeback-drawer.md
```

---

## Pause point

After Phase 3b lands, STOP and produce a pause-point report mirroring the Phase 3a format. Include:

1. Tag + commit SHA + Vercel dpl ID + build time
2. Bundle delta (first-load + total)
3. 19/19 preflight matrix
4. Smoke tests (verbatim outputs):
   - Switch to Dashboard mode (Alt+D) → BI grid renders with 3 rails + top strip + center
   - MOE matrix renders 785 nodes with domain colors
   - SSE stream delivers updates every ~5s
   - Conformance gauge shows ≥85% (target met)
   - Edit pencil opens drawer · CWH-gated write succeeds → reflected in dashboard within 30s
   - Postgres `conformance_snapshot` accrues rows over time
5. JSON evidence matrix
6. Open questions for Phase 3c (CHRONOS GCC gradient activation criteria · TUUI ripple effect intensity · particle density baseline ratios · aurora hero word triplet)

---

*Acuterium Technologies Inc. · Phase 3b brief · TS//SOVEREIGN*
*Doctrine: Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers*
