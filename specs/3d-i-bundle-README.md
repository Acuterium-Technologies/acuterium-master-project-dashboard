# Phase 3d-i · Face2Feel Spec Bundle

**Target tag:** `v1.5.0-alpha.4`
**Estimated engineering time:** ~2.5 hours
**Preflight rules:** 23 (3c's 21 + new 7.22 SW VERSION bump + 7.23 Sentinel dot visibility)
**Bundle version:** v1.0 · 2026-05-21
**F-11 compliant:** YES

---

## Dependency Order (implement in this sequence)

| # | Sub-spec | File | Time | Depends on |
|---|---|---|---|---|
| 0 | Master scope | `00-phase-3d-i-master-scope.md` | — | (read first) |
| 1 | Consent system | `01-consent-system.md` | 30 min | Phase 3c (App() root) |
| 2 | Sentinel dot | `02-sentinel-dot.md` | 15 min | #1 |
| 3 | Model loader | `03-model-loader.md` | 20 min | #1 |
| 4 | Face2Feel worker | `04-face2feel-worker.md` | 45 min | #2, #3 |
| 5 | PATHOS mapping | `05-pathos-mapping.md` | 15 min | #4 |
| 6 | Integration | `06-integration.md` | 25 min | #1–#5 + Phase 1D PATHOS |
| 7 | Tests | `07-tests-face2feel.spec.ts.md` | 20 min | #1–#6 |

**Total:** ~2.5 hours · single phase commit + tag `v1.5.0-alpha.4` + SW VERSION bump

---

## What ships in Phase 3d-i

- ✅ Three-tier consent UI (Off / Session-only / Persistent)
- ✅ Cam-active Sentinel dot (red · top-right · 8px solid + 16px pulsing ring)
- ✅ Lazy-loaded self-hosted MediaPipe Face Mesh + face-api.js tiny expression model
- ✅ Web Worker isolation (`/workers/face2feel.worker.ts`)
- ✅ 5fps · 320×240 capture · immediate `.dispose()` after inference
- ✅ 7-emotion → 5-axis PATHOS mapping with EMA α=0.3 smoothing
- ✅ MNEMOS save: PATHOS delta only · zero raw biometric persisted
- ✅ Confidence gate (no face / low confidence → `pathosDelta: null`)
- ✅ Playwright + Vitest coverage

## What does NOT ship in 3d-i (deferred)

- ❌ Voice2Feel (→ 3d-ii)
- ❌ Touch2Feel (→ 3d-iii)
- ❌ Tri-modal fusion (→ 3d-iv)
- ❌ Calibration panel for PATHOS weights (→ 3d-iv)
- ❌ KAIROS ≥0.75 auto-mode-switch gate (→ 3d-iv)
- ❌ Retention sweeper cron / DSAR / GDPR Art. 9 activation flag (→ 3d-v)

Phase 3d-i ships Face2Feel in **observation-only** mode: PATHOS bars update in Dashboard mode, but no automatic mode switching yet.

---

## Critical numeric locks for 3d-i

| Parameter | Value |
|---|---|
| Camera resolution | 320 × 240 |
| Frame rate | 5 fps |
| Inference interval | 200 ms (every other frame) |
| EMA smoothing α | 0.3 |
| Confidence floor | 0.6 (MediaPipe face detection) |
| No-face timeout | 3 s → emit null |
| Sentinel dot size | 8 px solid + 16 px pulsing ring |
| Sentinel dot color | `#ef4444` (red) |
| Sentinel pulse duration | 2 s · ease-in-out · infinite |
| Model bundle size | ~4 MB (lazy-loaded, SW-cached) |
| Consent localStorage key | `acu-master-ops:consent:face2feel:v1` |
| Worker path | `/workers/face2feel.worker.ts` |
| Models path | `/public/models/face2feel/` |
| MNEMOS PATHOS key | `acu-master-ops:mnemos:v1` (UNCHANGED — append to existing) |

---

## Non-negotiables

- **No raw frames/tensors/landmarks EVER leave the worker** (only the 5-axis PATHOS delta crosses postMessage)
- **`tf.dispose()` + `tf.tidy()` after EVERY inference** · zero tensor leaks
- **Sentinel dot MUST be visible the entire time camera is active** · no hiding under modals
- **Consent state machine:** Off → Session-only → Persistent (each tier explicit user action · no automatic upgrades)
- **D-09 quarantine:** all models self-hosted in `/public/models/` · no CDN runtime calls
- **MediaStream tracks `.stop()` called on consent revoke** · verified by Playwright

---

## Acceptance criteria (matched in `preflight-3d-i.json`)

1. Consent Off (default) · no camera permission requested · zero network calls to models
2. Consent Session-only · camera permission requested · models lazy-loaded · Sentinel dot visible · revoked on tab close
3. Consent Persistent · same as Session + localStorage flag set · survives tab close
4. Consent revoke (any tier) · `MediaStream.getTracks().forEach(t => t.stop())` · Sentinel dot hidden · localStorage cleared
5. Face detected · PATHOS bars update in Dashboard mode within 1s
6. No face for 3s · PATHOS delta emits null · last-known PATHOS retained (no jump to 0)
7. Camera permission denied · graceful fallback · UI shows "Camera unavailable" · no errors in console
8. Tab backgrounded · `document.visibilityState === 'hidden'` · worker pauses · Sentinel dot persists with "paused" amber tint
9. Tab foregrounded · worker resumes within 500ms
10. SW VERSION bumped to `acu-master-ops-v1.5.0-alpha.4` (F-14 discipline)
