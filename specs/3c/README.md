# Phase 3c · Living Interface

**Status:** Approved · ready for implementation
**Baseline:** `v1.5.0-alpha.2` (commit `70ca6bb` + middleware follow-up `9905e46`)
**Target tag:** `v1.5.0-alpha.3`
**Estimated wall time:** 2 to 3 hours
**Iron Rule:** Claude on `main`, no Codex in parallel

---

## What Phase 3c closes

- **ACAI V2 conformance F-04** sensors row "CHRONOS GCC prayer-time gradients" → 0% → 100%
- **ACAI V2 conformance F-04** modes row "TUUI ripple physics" → 30% → 90%
- **ACAI V2 conformance F-04** "Particle density variance per mode" → 40% → 100%
- **ACAI V2 conformance F-04** "Aurora hero stagger animation" → 50% → 100%
- **F-13** Phase 3b post-mortem · MOEMatrixFull.tsx empty placeholder → fill it in

Phase 3c is the "make the interface feel alive" phase. After 3c lands, the dashboard:

- Breathes with CHRONOS (background gradient changes through the day · Fajr · Duha · Dhuhr · Asr · Maghrib · Isha)
- Responds to touch with ripples (TUUI mode · auto-activates on touch devices)
- Has mode-specific particle density (3× ambient · 0.3× HUD · 1× default)
- Reveals the hero with a 3-word stagger animation on cold load
- Has the full MOE Expert Matrix canvas available at `?dashboard=moe`

ACAI V2 composite conformance target after 3c: **≥85%** (currently ~72% post-3b).

---

## Phase 3c scope · 4 sub-specs + 1 cleanup task + 1 Playwright extension

| # | Item | Time |
|---|---|---|
| 1 | `01-chronos-gcc-gradients.md` | 45 min |
| 2 | `02-tuui-ripple-physics.md` | 30 min |
| 3 | `03-particle-density-variance.md` | 25 min |
| 4 | `04-aurora-hero-stagger.md` | 20 min |
| 5 | `05-f13-moe-matrix-full.md` (cleanup from 3b) | 25 min |
| 6 | `tests/living-interface.spec.ts` | 20 min |

Total: ~3 hours.

---

## Preflight matrix (21 rules — Phase 3b's 19 + 2 new)

| # | Rule | Notes |
|---|---|---|
| 7.1 | Zero Manus refs in `src/`, `app/`, `data/` | Carry |
| 7.2 | Zero TODO/FIXME/placeholder in new files | Carry |
| 7.3 | 12 CWH rule IDs preserved | Carry |
| 7.4 | Target enum 4 base + 6 update variants | Carry |
| 7.5 | 6 valid kairosMode values | Carry |
| 7.6 | PATHOS axis order | Carry |
| 7.7 | Leak-fix middleware not regressed | Carry |
| 7.8 | Bearer-cookie on all new endpoints | n/a (3c has no new endpoints) |
| 7.9 | Rate-limit 429 + Retry-After | Carry |
| 7.10 | `npm run typecheck` clean | |
| 7.11 | `npm run lint` clean | |
| 7.12 | `npm run test` all green | ~95 tests after 3c |
| 7.13 | Bundle delta < +20 kB first-load | tighter than 3b · 3c is CSS + JS · no new deps |
| 7.14 | AuditLog writes JSONL + Postgres | Carry |
| 7.15 | Client preview verdict = server verdict | Carry |
| 7.16 | **base-CSS-before-override (LOAD-BEARING)** | Heaviest 7.16 phase to date · all CSS sub-specs touch tokens + selectors |
| 7.17 | Postgres migration idempotent | No new migrations in 3c |
| 7.18 | BI grid has independent left/right rails | Carry |
| 7.19 | SSE channel separate from Sheets polling | Carry |
| 7.20 | **CHRONOS gradient changes at the 6 GCC prayer-time boundaries** | Verified via mock-clock test |
| 7.21 | **Reduced-motion media query respected by ALL 3c animations** | Aurora · ripples · particles · breath orb all skip animation when prefers-reduced-motion |

---

## Doctrinal red-lines

- All 6 CHRONOS gradients must use ACAI V2 canon hex stops (no approximation)
- TUUI ripple expansion uses `requestAnimationFrame` (not setInterval · no jank)
- Particle density variance must NOT exceed 200 particles in any mode (memory cap)
- Aurora hero stagger MUST honor `prefers-reduced-motion: reduce` (accessibility)
- All animations pausable when `document.visibilitychange` fires (background tab CPU)
- No new external dependencies (no GSAP, no anime.js · hand-rolled with native CSS animations + RAF)
- Glass transparency 45-55%
- Diacritics preserved (Arabic CHRONOS labels: الفجر · الضحى · الظهر · العصر · المغرب · العشاء)
- Iron Rule: Claude on main, no Codex in parallel

---

## Implementation order (dependency-aware)

1. **3c.05 MOEMatrixFull (F-13 cleanup)** — small, derisks 3b post-mortem
2. **3c.04 Aurora hero stagger** — one-time animation, minimal risk
3. **3c.03 Particle density** — extends existing ParticleNetwork class
4. **3c.02 TUUI ripple** — touch-conditional, doesn't affect desktop
5. **3c.01 CHRONOS gradients** — biggest cross-cutting change, save for last
6. **tests/living-interface.spec.ts** — Playwright with mock-clock for CHRONOS

---

## Commit message template

```
Phase 3c · Living interface (CHRONOS · TUUI · particles · aurora)

- CHRONOS GCC prayer-time gradients (Fajr/Duha/Dhuhr/Asr/Maghrib/Isha)
- TUUI ripple physics (touch-device auto-activation, 48px min targets)
- Particle density variance per mode (3x ambient, 0.3x HUD, 1x default)
- Aurora hero stagger 3-word reveal (MASTER · OPERATIONS · ACUTERIUM)
- F-13 cleanup: MOEMatrixFull.tsx implemented (was 0-byte placeholder)
- Playwright living-interface.spec.ts (5 viewports + mock-clock CHRONOS)

Closes Phase 3c of v1.5 roadmap.
Closes ACAI V2 conformance gaps for CHRONOS, TUUI, particles, aurora.
Closes F-13 (MOEMatrixFull empty file from Phase 3b).
Postmortem rule 7.16 LOAD-BEARING this phase (heaviest CSS work to date).
Reduced-motion compliance verified for all new animations.

Refs:
- specs/3c/01-chronos-gcc-gradients.md
- specs/3c/02-tuui-ripple-physics.md
- specs/3c/03-particle-density-variance.md
- specs/3c/04-aurora-hero-stagger.md
- specs/3c/05-f13-moe-matrix-full.md
```

---

## Pause point

After Phase 3c lands, produce a pause-point report mirroring Phase 3b. Surface:

1. Tag + commit SHA + Vercel dpl ID + build time
2. Bundle delta
3. 21/21 preflight matrix
4. Smoke tests (verbatim):
   - Mock clock at 05:00 (Fajr period) → background gradient shows Fajr palette
   - Mock clock at 09:00 (Duha) → Duha palette
   - Mock clock at 18:00 (Maghrib) → Maghrib palette
   - Locale `ar-OM` → Arabic labels render (الفجر etc.)
   - Touch device emulation → TUUI mode auto-activates after 10s idle on touch
   - Click element with `.tuui-target` → ripple animation visible
   - Switch to Ambient → particle count 3× baseline
   - Switch to HUD → particle count 0.3× baseline
   - Cold reload → aurora hero shows 3-word stagger reveal
   - `prefers-reduced-motion: reduce` → no animations
   - `?dashboard=moe` query → MOEMatrixFull renders full canvas with hover tooltips
5. ACAI V2 conformance gauge reading (target ≥85%)
6. JSON evidence matrix
7. Open questions for Phase 3d-i (Face2Feel)

---

*Acuterium Technologies Inc. · Phase 3c brief · TS//SOVEREIGN*
*Doctrine: Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers*
