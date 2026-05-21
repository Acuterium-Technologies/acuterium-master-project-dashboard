# Phase 3b Spec Bundle · 2026-05-21

This bundle contains everything Claude Code needs to land Phase 3b
(Dashboard mode BI grid + write-back UI) on top of Phase 3a baseline.

## Directory layout

```
phase-3b-specs/
├── README.md                                (this file)
├── specs/
│   └── 3b/
│       ├── README.md                        (Phase 3b one-page brief)
│       ├── 01-bi-grid-layout.md             (BIGrid + LeftRail + TopStrip + RightRail)
│       ├── 02-moe-expert-matrix.md          (785-node canvas + SSE stream)
│       ├── 03-acai-conformance-gauge.md     (hybrid client+server)
│       └── 04-writeback-drawer.md           (edit drawer + CWH preview)
└── tests/
    └── dashboard-mode.spec.ts               (Playwright spec for Dashboard mode at 5 viewports)
```

## How to use

1. Drop the entire bundle into the repo working tree (adds specs/3b/* and tests/dashboard-mode.spec.ts)
2. Read `specs/3b/README.md` for the one-page brief
3. Implement in dependency order: 03 conformance → 01 BI grid → 02 MOE matrix → 04 writeback drawer
4. Add the Playwright spec last (covers the visual regression for the whole Dashboard mode)
5. Tag v1.5.0-alpha.2 + push
6. Produce pause-point report mirroring Phase 3a format

## Doctrinal context

- All specs honor the doctrine: "Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers"
- Iron Rule: Claude on `main` only, no Codex in parallel
- D-09 Manus quarantine: zero references in code/network
- 12 CWH rule IDs preserved exactly
- Glass transparency 45-55%
- Diacritics: Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI · M-PCB · Edna
- Iron Rule: Claude on main, no Codex in parallel

## Resolved open questions from Phase 3a

1. BI grid breakpoints: ≥1280px / 768-1279px / <768px (spec 01)
2. MOE matrix update frequency: independent 5s SSE channel (spec 02)
3. ACAI gauge data source: hybrid client+server, weights 0.7/0.3 (spec 03)
4. Postgres connection target: stay on Vercel Postgres for v1.5 (revisit in v1.6)
5. Blob retention sweeper: filed for follow-up cron (NOT in 3b scope)

## Open questions for Phase 3c (operator decides post-3b)

- CHRONOS GCC gradient activation criteria
- TUUI ripple effect intensity tuning
- Particle density baseline ratios for each mode
- Aurora hero word triplet (specs/00-phase-3-master-scope-v3.0.md §3c.05)
