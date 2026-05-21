# Phase 3c Spec Bundle · 2026-05-21

This bundle contains everything Claude Code needs to land Phase 3c
(Living Interface · CHRONOS · TUUI · particles · aurora · F-13 cleanup)
on top of Phase 3b baseline.

## Directory layout

```
phase-3c-specs/
├── README.md                                (this file)
├── specs/
│   └── 3c/
│       ├── README.md                        (Phase 3c one-page brief · 21-rule preflight matrix)
│       ├── 01-chronos-gcc-gradients.md      (6 GCC + 6 standard time-of-day periods)
│       ├── 02-tuui-ripple-physics.md        (touch ripples + 48px enforcement + auto-activation)
│       ├── 03-particle-density-variance.md  (per-mode density multipliers)
│       ├── 04-aurora-hero-stagger.md        (3-word reveal · cold load only)
│       └── 05-f13-moe-matrix-full.md        (CLEANUP from Phase 3b F-13)
└── tests/
    └── living-interface.spec.ts             (Playwright · CHRONOS mock-clock + TUUI ripple + particle density + aurora + F-13)
```

## How to use

1. Drop the entire bundle into the repo working tree (adds specs/3c/* and tests/living-interface.spec.ts)
2. Read `specs/3c/README.md` for the one-page brief
3. Implement in dependency order: 05 F-13 cleanup → 04 aurora → 03 particles → 02 TUUI → 01 CHRONOS
4. Add the Playwright spec last
5. Tag v1.5.0-alpha.3 + push
6. Produce pause-point report mirroring Phase 3a/3b format

## Doctrinal context

- All specs honor the doctrine: "Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers"
- Iron Rule: Claude on `main` only, no Codex in parallel
- D-09 Manus quarantine: zero references in code/network
- 12 CWH rule IDs preserved exactly
- Glass transparency 45-55%
- Diacritics: Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI · M-PCB · Edna
- All new animations honor `prefers-reduced-motion: reduce`
- No new external dependencies (no GSAP, no anime.js · CSS + RAF + native APIs)

## Inherits from Phase 3b

- BIGrid layout · MOEMatrixMini · ConformanceGauge · EditDrawer all functional
- F-13 cleanup: MOEMatrixFull goes from 0-byte placeholder to fully implemented
- CHRONOS gradients applied to body background · BIGrid + Overview sections both see them
- Aurora hero stagger fires ONCE per browser session (not on every mode switch)

## Closes ACAI V2 conformance gaps

| Gap | Before 3c | After 3c |
|---|---|---|
| CHRONOS GCC gradients | 0% | 100% |
| TUUI ripple physics | 30% | 90% |
| Particle density variance | 40% | 100% |
| Aurora hero stagger | 50% | 100% |
| MOE matrix full canvas | 50% (mini only) | 100% (mini + full) |

ACAI V2 composite conformance target after 3c: **≥85%** (currently ~72% post-3b).

## Open questions for Phase 3d-i (Face2Feel)

- Operator's DPIA review timing
- Face2Feel default consent tier (DENY locked per Phase 3 master scope)
- Sentinel-Light position in BI grid top strip
- Phase 3d-i target tag = v1.5.0-alpha.4
