# Phase 3a · Foundation + QA-tooling baseline

**Status:** Approved · ready for implementation
**Baseline:** v1.4.0-rc.2 (commit `9c782c2`) + the post-Mission-Zero KPI fix
**Target tag:** `v1.5.0-alpha.1`
**Estimated wall time:** 2 to 3 hours
**Iron Rule:** Claude on `main`, no Codex in parallel

---

## Mission Zero (5 min · do this BEFORE Phase 3a work)

Fix a KPI insertion bug left over from PowerShell data-updater commit `f8e6e34`. See:
- `specs/3a/MISSION-ZERO.md` for the exact fix

---

## Phase 3a scope (six sub-specs · each implementable independently)

| # | Spec file | Title | Time |
|---|---|---|---|
| 1 | `01-postgres-auditlog-mirror.md` | Postgres durable mirror + Vercel Blob backup | 45 min |
| 2 | `02-sheets-adapter.md` | Google Sheets read + CWH-gated write | 60 min |
| 3 | `03-acai-v2-token-drift.md` | Token canon alignment + Government Edition tokens | 15 min |
| 4 | `04-idempotency-keys.md` | `idempotencyKey` field for `/api/cwh/transition` | 30 min |
| 5 | `05-playwright-hero-spec.md` | Visual regression Playwright suite (closes F-06) | 20 min |
| 6 | `06-qa-checklist-markdown.md` | `docs/qa/hero-logo-guardrail.md` (closes F-07) | 10 min |

Total: ~3 hours of focused work.

---

## Preflight matrix (17 rules)

| # | Rule | Notes |
|---|---|---|
| 7.1 | Zero Manus references in `src/`, `app/`, `data/` | grep `manus-sdk \| @manus \| manus_api \| manus.ai \| manus-cli` |
| 7.2 | Zero TODO / FIXME / placeholder in new files | grep new files |
| 7.3 | 12 CWH rule IDs preserved | `CWH-R-01` .. `CWH-R-12` in `rules.json` |
| 7.4 | Target enum: 4 base + 6 update variants | `task \| milestone \| od \| residue \| task-update \| kpi-update \| od-update \| milestone-update \| residue-update \| surface-update` |
| 7.5 | 6 valid kairosMode values | `AUI \| HUD \| TUUI \| GUI \| Dashboard \| Ambient` |
| 7.6 | PATHOS axis order | `Stress · Focus · Curiosity · Fatigue · Satisfaction` |
| 7.7 | Leak-fix middleware not regressed | `git diff 58b61d1 -- middleware.ts` |
| 7.8 | Bearer-cookie auth on all new endpoints | `acuterium-access` cookie |
| 7.9 | Rate-limit returns 429 + Retry-After | unchanged from Phase 2 |
| 7.10 | `npm run typecheck` | clean |
| 7.11 | `npm run lint` | clean |
| 7.12 | `npm run test` | all new tests pass + Phase 2 tests still pass |
| 7.13 | Bundle delta < +35 kB first-load (googleapis is the heavy dep) | server-only routes ship 0 B to client |
| 7.14 | AuditLog writes verified to BOTH JSONL and Postgres | smoke test |
| 7.15 | Client preview verdict = server verdict | 100% parity |
| 7.16 | **base-CSS-before-override (LOAD-BEARING this phase)** | grep verification |
| 7.17 | **Postgres migration is idempotent** | run twice, same row count |

---

## Doctrinal red-lines

- 12 CWH rule IDs preserved exactly
- Sheets adapter gracefully degrades when env vars unset (no hard dependency)
- Postgres failure does NOT block API responses (JSONL fallback)
- Idempotency keys never appear in error responses or logs
- Service account private key never in build output or browser bundle
- Glass transparency 45-55%
- Diacritics preserved (Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI · M-PCB · Edna)
- Zero external chart libraries · zero Google Fonts CDN at runtime
- D-09 Manus quarantine intact
- MNEMOS key `acu-master-ops:mnemos:v1` locked (no v2)
- Iron Rule: Claude on main only, no Codex in parallel

---

## Commit message template

```
Phase 3a · Foundation + QA-tooling baseline

- Postgres AuditLog mirror with denormalized schema + JSONB raw
- Vercel Blob backup with 90d hot / 730d warm retention
- Google Sheets adapter (read + CWH-gated write) with fallback to static
- ACAI V2 token drift fix: --radius-lg 22px + breath/orb/govEd tokens
- Idempotency keys on /api/cwh/transition (LRU 1000, TTL 1h)
- Playwright hero visual regression (5 viewports)
- QA checklist markdown anchored in docs/qa/

Closes Phase 3a of v1.5 roadmap.
Closes F-06 + F-07 (logo-fix QA gaps from 2026-05-21 audit).
Closes F-08 cookie-name canonicalization (use 'acuterium-access' uniformly).
Closes F-10 KPI insertion regex bug.
Postmortem rule 7.16 LOAD-BEARING this phase (CSS touched).

Refs:
- specs/00-phase-3-master-scope-v3.0.md
- specs/3a/01-postgres-auditlog-mirror.md
- specs/3a/02-sheets-adapter.md
- specs/3a/03-acai-v2-token-drift.md
- specs/3a/04-idempotency-keys.md
- specs/3a/05-playwright-hero-spec.md
- specs/3a/06-qa-checklist-markdown.md
```

---

## Pause point

After Phase 3a lands, STOP and hand back to operator + Perplexity QA. Pause-point report MUST include:

1. Tag + commit SHA + Vercel dpl ID + build time
2. Bundle delta (first-load + total transferred)
3. 17-rule preflight matrix (table)
4. Smoke tests (verbatim outputs):
   - 4× CWH POST (allow/deny/401/429) — same as Phase 2
   - Idempotency: 5× POST with same key → 1 audit row, 5 identical responses
   - Idempotency collision: same key, different targetId → 409
   - Sheets read: with env vars → live data
   - Sheets read: without env vars → static fallback
   - Sheets write: CWH-gated denies stress > 90
   - Postgres migration: run twice → same row count
5. JSON evidence matrix (same shape as Phase 2 report)
6. Open questions for Phase 3b (BI grid breakpoints · MOE matrix update frequency · ACAI conformance gauge data source)

---

*Acuterium Technologies Inc. · Phase 3a brief · TS//SOVEREIGN*
*Doctrine: Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers*
