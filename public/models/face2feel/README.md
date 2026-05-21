# Face2Feel · Self-Hosted ML Model Bundle

Phase 3d-i · D-09 quarantine (zero CDN runtime calls).

## Layout

```
public/models/face2feel/
├── mediapipe/
│   └── face_landmarker.task                  3.6 MB  · Apache-2.0 · Google MediaPipe
├── face-api/
│   ├── tiny_face_detector_model-weights_manifest.json
│   ├── tiny_face_detector_model-shard1       189 KB · MIT · justadudewhohacks/face-api.js
│   ├── face_expression_model-weights_manifest.json
│   └── face_expression_model-shard1          322 KB · MIT · justadudewhohacks/face-api.js
├── LICENSE-Apache-2.0.txt                    MediaPipe upstream license
├── LICENSE-MIT.txt                           face-api.js upstream license
├── INTEGRITY.json                            SHA-256 hashes (LOCKED · verified at runtime in production)
└── README.md                                 this file
```

## Sources

| Asset | Upstream URL | License | Snapshot date |
|---|---|---|---|
| `face_landmarker.task` | `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` | Apache-2.0 | 2026-05-21 |
| face-api.js weights | `https://github.com/justadudewhohacks/face-api.js/raw/master/weights/*` | MIT | 2026-05-21 |

## Service worker caching

`public/sw.js` adds `/models/face2feel/` to its runtime-cache pattern list in Phase 3d-i. First load fetches from same-origin; subsequent loads are served from the service-worker cache. SW VERSION bump to `acu-master-ops-v1.5.0-alpha.4` invalidates the prior cache on activate.

## Doctrinal red-lines

- **No CDN runtime calls.** Every byte served same-origin via `/models/face2feel/*`.
- **No third-party model registries.** Bundles snapshotted to this directory.
- **Integrity verification optional in dev**, required in production (see `src/lib/biometrics/integrity.ts`).
- **Models load only when consent tier ≠ off** (see `src/lib/biometrics/model-loader.ts`).
