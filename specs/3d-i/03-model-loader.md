# 3d-i · Sub-spec 03 · Model Loader

**Time:** 20 min · **Depends on:** 01 consent system
**Critical:** D-09 quarantine · all models self-hosted · zero CDN runtime calls

---

## Model Storage Layout

```
public/models/face2feel/
├── mediapipe/
│   ├── face_landmarker.task              ~3.2 MB
│   ├── vision_wasm_internal.wasm         ~250 KB
│   ├── vision_wasm_nosimd_internal.wasm  ~280 KB (fallback)
│   └── LICENSE-Apache-2.0.txt
├── face-api/
│   ├── tiny_face_detector_model-weights_manifest.json
│   ├── tiny_face_detector_model-shard1   ~190 KB
│   ├── face_expression_model-weights_manifest.json
│   ├── face_expression_model-shard1      ~210 KB
│   └── LICENSE-MIT.txt
└── README.md                              (attribution + version)
```

---

## Download Sources (one-time · operator runs locally · commits to repo)

```bash
# MediaPipe Tasks Vision
curl -L https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task \
  -o public/models/face2feel/mediapipe/face_landmarker.task

# face-api.js model weights from GitHub release
curl -L https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json \
  -o public/models/face2feel/face-api/tiny_face_detector_model-weights_manifest.json
curl -L https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1 \
  -o public/models/face2feel/face-api/tiny_face_detector_model-shard1
curl -L https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_expression_model-weights_manifest.json \
  -o public/models/face2feel/face-api/face_expression_model-weights_manifest.json
curl -L https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_expression_model-shard1 \
  -o public/models/face2feel/face-api/face_expression_model-shard1

# Verify integrity AFTER commit
sha256sum public/models/face2feel/mediapipe/face_landmarker.task
sha256sum public/models/face2feel/face-api/*-shard1
# Record hashes in public/models/face2feel/INTEGRITY.json (LOCKED · matched at load time)
```

---

## NPM Dependencies (add to `package.json`)

```json
{
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.18",
    "face-api.js": "^0.22.2"
  }
}
```

Both are MIT/Apache · D-09 clean · no Manus references in their dep trees (verify with `npm ls | grep -i manus` after install).

---

## Loader

```typescript
// src/lib/biometrics/model-loader.ts

import type { FaceLandmarker } from '@mediapipe/tasks-vision';

const BASE_PATH = '/models/face2feel';

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
let faceApiPromise: Promise<typeof import('face-api.js')> | null = null;

export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(`${BASE_PATH}/mediapipe`);
    return FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `${BASE_PATH}/mediapipe/face_landmarker.task`,
        delegate: 'GPU',  // fallback to CPU automatically
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.6,  // LOCKED
      minFacePresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,     // we don't need blendshapes · saves cycles
      outputFacialTransformationMatrixes: false,
    });
  })();

  return landmarkerPromise;
}

export async function loadFaceApi(): Promise<typeof import('face-api.js')> {
  if (faceApiPromise) return faceApiPromise;

  faceApiPromise = (async () => {
    const faceapi = await import('face-api.js');
    await faceapi.nets.tinyFaceDetector.loadFromUri(`${BASE_PATH}/face-api`);
    await faceapi.nets.faceExpressionNet.loadFromUri(`${BASE_PATH}/face-api`);
    return faceapi;
  })();

  return faceApiPromise;
}

/**
 * Tear down models on consent revoke.
 * Frees GPU memory and lets garbage collection reclaim ~4 MB.
 */
export async function unloadModels(): Promise<void> {
  if (landmarkerPromise) {
    const lm = await landmarkerPromise;
    lm.close();
    landmarkerPromise = null;
  }
  faceApiPromise = null;  // face-api.js doesn't expose explicit unload
}
```

---

## Service Worker Caching

The existing `public/sw.js` already caches `/models/*` paths if listed in `RUNTIME_CACHE`. Verify by adding (or confirming) this clause:

```javascript
// public/sw.js · within fetch handler

const RUNTIME_PATTERNS = [
  /^\/master-ops/,
  /^\/api\/dashboard/,
  /^\/models\/face2feel\//,   // NEW · 3d-i
];

// Cache-first strategy for models · they're versioned by file content
if (RUNTIME_PATTERNS.some(p => p.test(url.pathname))) {
  event.respondWith(
    caches.open(`runtime::${VERSION}`).then(cache =>
      cache.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
      )
    )
  );
  return;
}
```

After SW VERSION bump to `v1.5.0-alpha.4`, the old cache is purged in the `activate` event handler (existing code already does this).

---

## Integrity Check

```typescript
// src/lib/biometrics/integrity.ts

import integrity from '../../../public/models/face2feel/INTEGRITY.json';

export async function verifyModelIntegrity(): Promise<boolean> {
  // Optional · runs once per SW cache warmup
  // Skip in dev (NODE_ENV !== 'production')
  if (process.env.NODE_ENV !== 'production') return true;
  
  for (const [path, expectedSha] of Object.entries(integrity)) {
    const res = await fetch(`/models/face2feel/${path}`);
    const buf = await res.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (hex !== expectedSha) {
      console.error(`[Face2Feel] Model integrity check failed: ${path}`);
      return false;
    }
  }
  return true;
}
```

`INTEGRITY.json` shape:

```json
{
  "mediapipe/face_landmarker.task": "abc123...",
  "face-api/tiny_face_detector_model-shard1": "def456...",
  "face-api/face_expression_model-shard1": "789xyz..."
}
```

Hashes generated locally and committed.

---

## Acceptance

1. `loadFaceLandmarker()` returns a FaceLandmarker · no network calls to `storage.googleapis.com` · models fetched from `/models/face2feel/mediapipe/`
2. `loadFaceApi()` loads both tinyFaceDetector and faceExpressionNet from `/models/face2feel/face-api/`
3. Network tab shows ALL model bytes coming from same origin · NO third-party CDN
4. Second call to `loadFaceLandmarker()` returns the cached promise (no re-download)
5. After consent revoke + `unloadModels()` · `landmarker.close()` called · GPU memory freed
6. Service worker caches models on first activation · subsequent loads are from cache (Network tab "(ServiceWorker)")
7. `verifyModelIntegrity()` in production returns true · SHA-256 matches `INTEGRITY.json`
8. `npm ls | grep -i manus` returns empty (D-09 quarantine verified)
