# Phase 3d-i · Face2Feel · Master Scope

**Ticket:** ACU-MASTER-OPS-3d-i
**Owner:** Dr. Jay (Acuterium Technologies)
**Engineer:** Claude Code Web (CH-2)
**Spec author:** Perplexity orchestrator
**Date:** 2026-05-21

---

## Mission

Add **Face2Feel** — camera-gated facial emotion detection — to the Master Operations Dashboard. Output: 5-axis PATHOS delta fused with the existing NEXUS behavioral signal. UI: live PATHOS bars update in Dashboard mode panel. Discipline: edge-only inference · immediate-delete biometric pipeline · GDPR-grade consent · Sentinel screen indicator.

This is the FIRST of three sensing channels in Phase 3d. Tri-modal fusion + auto-mode-switching arrive in 3d-iv. GDPR Art. 9 activation flag flips in 3d-v.

---

## Doctrine Alignment

**Phase 3 LOCKED v3.0 doctrine excerpt** (from `acu_master_plan_locked_v2`):

> "Multi-modal sensing: camera (Face2Feel), microphone (Voice2Feel · including breathing-rate detection), pointer/touch (Touch2Feel). Full GDPR compliance: all biometric data deleted immediately after each reference. Sentinel notification light comes on the screen every time a mic, speaker or cam is used."

**This phase delivers the camera channel only.** Voice and touch are deferred to 3d-ii and 3d-iii per the dependency chain.

---

## Architecture Summary

```
[ User opens Master Ops Dashboard ]
        ↓
[ ConsentPanel appears in /settings or first-run modal ]
        ↓
[ User selects: Off | Session-only | Persistent ] for Face2Feel
        ↓
   If NOT Off:
        ↓
[ Lazy-load /public/models/face2feel/* via dynamic import ]
        ↓
[ navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 5 } }) ]
        ↓
[ Sentinel dot mounts top-right · red pulsing ]
        ↓
[ Hidden <video> element receives stream ]
        ↓ (every 200ms via requestAnimationFrame throttle)
[ Web Worker: face2feel.worker.ts ]
   1. captureFrame(video) → OffscreenCanvas
   2. MediaPipe Face Mesh → landmarks + bbox + confidence
   3. If confidence < 0.6 → postMessage({ pathosDelta: null, confidence: 0 })
   4. Else: face-api.js → 7-emotion vector
   5. emotionToPathos() → 5-axis delta
   6. tf.dispose() ALL tensors · tidy()
   7. postMessage({ pathosDelta, confidence, timestamp })
        ↓
[ Main thread: useFace2Feel() hook ]
        ↓
[ computePATHOS() fuses with NEXUS signal · EMA α=0.3 ]
        ↓
[ MNEMOS.save() — 5-axis vector only, NEVER the frame ]
        ↓
[ <PathosBars /> in Dashboard mode updates ]
```

---

## File Tree (new files in this phase)

```
acuterium-master-project-dashboard/
├── app/(operations)/master-ops/
│   └── settings/
│       └── biometrics/
│           └── page.tsx                          NEW · consent panel route
├── src/components/biometrics/
│   ├── ConsentPanel.tsx                          NEW · 3-tier consent UI
│   ├── SentinelDot.tsx                           NEW · cam-active indicator
│   └── BiometricStatusBadge.tsx                  NEW · status pill for Dashboard
├── src/hooks/
│   ├── useFace2Feel.ts                           NEW · main thread interface
│   └── useConsent.ts                             NEW · 3-tier state machine
├── src/lib/biometrics/
│   ├── face2feel-types.ts                        NEW · TypeScript contracts
│   ├── pathos-mapping.ts                         NEW · 7-emotion → 5-axis formula
│   ├── model-loader.ts                           NEW · lazy + SW-cached loader
│   └── consent-state.ts                          NEW · state machine + localStorage
├── public/
│   ├── workers/
│   │   └── face2feel.worker.ts                   NEW · inference worker
│   └── models/face2feel/
│       ├── mediapipe/
│       │   ├── face_landmarker.task              NEW · ~3.2 MB · self-hosted
│       │   └── vision_wasm_internal.wasm         NEW · ~250 KB
│       └── face-api/
│           ├── tiny_face_detector_model-weights_manifest.json    NEW
│           ├── tiny_face_detector_model-shard1                   NEW
│           ├── face_expression_model-weights_manifest.json       NEW
│           └── face_expression_model-shard1                      NEW · ~200 KB
├── app/legal/
│   └── biometric/
│       └── page.tsx                              NEW · GDPR Art. 9 disclosure (AR/EN)
├── tests/
│   ├── face2feel.spec.ts                         NEW · Playwright
│   └── unit/
│       └── pathos-mapping.test.ts                NEW · Vitest
└── src/lib/conformance/
    └── matrix.ts                                 MODIFIED · add face2feel probe
```

---

## Engine Integration Contract

The existing `window.__acai` object MUST be extended:

```typescript
window.__acai = {
  kairos: KairosEngine,
  pathos: PathosEngine,
  nexus: NexusEngine,
  telos: TelosEngine,
  face2feel: {                          // NEW
    status: 'off' | 'session' | 'persistent',
    isActive: boolean,
    lastPathosDelta: PathosDelta | null,
    lastConfidence: number,
    revoke: () => void,
  }
};
```

The conformance matrix (`src/lib/conformance/matrix.ts`) gets a new probe:

```typescript
{
  id: 'face2feel-engine',
  label: 'Face2Feel Engine',
  weight: 5,
  probe: () => typeof window.__acai?.face2feel === 'object',
}
```

After Phase 3d-i lands, ACAI V2 conformance should rise from current ~85% (post-3c) to ~88% (probe present, gated by user consent).

---

## Definition of Done

1. All 23 preflight rules pass on PAUSE-POINT
2. Tests: 91 (3c baseline) + ~22 new = ~113 total · all green
3. `/master-ops/settings/biometrics` route accessible · consent UI renders
4. With consent ON: camera permission requested, Sentinel dot visible, PATHOS bars animate
5. With consent OFF (default): zero camera permission, zero model downloads, zero Sentinel dot
6. Consent revoke: MediaStream tracks stopped (verified by Playwright `getUserMedia` spy)
7. SW VERSION bumped to `acu-master-ops-v1.5.0-alpha.4`
8. Tag `v1.5.0-alpha.4` pushed · Vercel READY · production smoke battery green
9. Pause-point report with evidence matrix JSON in the standard shape
10. Bundle size delta: `/master-ops` first-load ≤ 145 kB (3c was 131 kB · +14 kB headroom for new hooks/components · models lazy-loaded so they DON'T count)

---

## Known Follow-ups (commit message section)

- F-15 (open after 3d-i): PATHOS calibration panel — defer to 3d-iv as planned
- F-16 (open after 3d-i): Voice2Feel — picked up in 3d-ii
- F-17 (open after 3d-i): Touch2Feel — picked up in 3d-iii
- F-13 (closed in 3c): MOEMatrixFull rendered
- F-14 (active discipline): SW VERSION bump in phase commit · enforced here
