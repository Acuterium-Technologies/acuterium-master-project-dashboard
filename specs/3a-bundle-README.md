# Phase 3a Spec Bundle · 2026-05-21

This bundle contains everything Claude Code needs to land Phase 3a of the Acuterium Master Operations Dashboard.

## Directory layout

```
phase-3a-specs/
├── README.md                                    (this file)
├── specs/
│   ├── 00-phase-3-master-scope-v3.0.md          (master Phase 3 scope · approved)
│   └── 3a/
│       ├── README.md                            (Phase 3a one-page brief)
│       ├── MISSION-ZERO.md                      (KPI fix · do FIRST · 5 min)
│       ├── 01-postgres-auditlog-mirror.md       (Postgres + Vercel Blob)
│       ├── 02-sheets-adapter.md                 (read + CWH-gated write)
│       ├── 03-acai-v2-token-drift.md            (token canon + Gov Edition)
│       ├── 04-idempotency-keys.md               (LRU 1000, TTL 1h)
│       ├── 05-playwright-hero-spec.md           (visual regression)
│       └── 06-qa-checklist-markdown.md          (PR-review gate)
├── tests/
│   └── hero-brand.spec.ts                       (copy verbatim to repo tests/)
└── docs/
    └── qa/
        └── hero-logo-guardrail.md               (copy verbatim to repo docs/qa/)
```

## How to use

1. Drop the entire bundle into the repo working tree (it adds `specs/`, `tests/`, `docs/` at root)
2. Read `specs/3a/README.md` for the one-page brief
3. Execute `specs/3a/MISSION-ZERO.md` first (5 min KPI fix)
4. Then implement the 6 Phase 3a sub-specs in any order (each is independent)
5. Pause when complete and produce the JSON evidence matrix per Phase 2 format

## Doctrinal context

- All specs honor the doctrine: "Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers"
- Iron Rule: Claude on `main` only, no Codex in parallel
- D-09 Manus quarantine: zero references in code/network
- 12 CWH rule IDs preserved exactly
- Glass transparency 45-55%
- Diacritics: Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI · M-PCB · Edna

## Open questions for Phase 3b (do not address now)

- BI grid layout breakpoints
- MOE Expert Matrix update frequency
- ACAI conformance gauge data source

Phase 3b dispatch packet will resolve these and ship the Dashboard mode BI grid + MOE matrix + conformance gauge.
