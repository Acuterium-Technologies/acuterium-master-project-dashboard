# 3d-i · Sub-spec 04 · Face2Feel Web Worker

**Time:** 45 min · **Depends on:** 02 Sentinel dot · 03 Model loader
**Critical:** All inference + tensor lifecycle isolated to worker · main thread NEVER sees raw frames

---

## Worker Contract

### Inbound messages (main → worker)

```typescript
type InboundMessage =
  | { type: 'INIT' }
  | { type: 'FRAME'; bitmap: ImageBitmap; timestamp: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SHUTDOWN' };
```

### Outbound messages (worker → main)

```typescript
type OutboundMessage =
  | { type: 'READY' }
  | { type: 'PATHOS'; delta: PathosDelta | null; confidence: number; timestamp: number }
  | { type: 'ERROR'; code: string; message: string };
```

**NEVER transmit:** `ImageBitmap`, `ImageData`, `Float32Array` of landmarks, raw emotion vectors. ONLY the 5-axis `PathosDelta` + scalar confidence + timestamp.

---

## Worker Implementation

```typescript
// public/workers/face2feel.worker.ts
// Note: TypeScript source compiled to /public/workers/face2feel.worker.js
// OR served as a Next.js dynamic worker via `new Worker(new URL('./...', import.meta.url))`

import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import * as faceapi from 'face-api.js';
import { emotionToPathos } from '../../src/lib/biometrics/pathos-mapping';
import type { PathosDelta } from '../../src/lib/biometrics/face2feel-types';

let landmarker: FaceLandmarker | null = null;
let isPaused = false;
let lastFaceTimestamp = 0;
const NO_FACE_TIMEOUT_MS = 3000;  // LOCKED
const MIN_CONFIDENCE = 0.6;       // LOCKED

const BASE = '/models/face2feel';

async function init() {
  const vision = await FilesetResolver.forVisionTasks(`${BASE}/mediapipe`);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${BASE}/mediapipe/face_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: MIN_CONFIDENCE,
    minFacePresenceConfidence: MIN_CONFIDENCE,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  // face-api.js initialized in main thread first (it needs DOM-ish env)
  // Worker only uses MediaPipe for detection · we'll do expression in main thread
  // OR alternatively: use TFJS directly here (skip face-api.js wrapper)

  await faceapi.nets.tinyFaceDetector.loadFromUri(`${BASE}/face-api`);
  await faceapi.nets.faceExpressionNet.loadFromUri(`${BASE}/face-api`);

  postMessage({ type: 'READY' } satisfies OutboundMessage);
}

async function processFrame(bitmap: ImageBitmap, timestamp: number) {
  if (!landmarker || isPaused) {
    bitmap.close();
    return;
  }

  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  try {
    // 1. Detect face via MediaPipe
    const result: FaceLandmarkerResult = landmarker.detectForVideo(bitmap, timestamp);
    
    if (!result.faceLandmarks?.length) {
      // No face detected
      const dt = timestamp - lastFaceTimestamp;
      if (dt > NO_FACE_TIMEOUT_MS) {
        postMessage({
          type: 'PATHOS',
          delta: null,
          confidence: 0,
          timestamp,
        } satisfies OutboundMessage);
      }
      return;
    }
    
    lastFaceTimestamp = timestamp;

    // 2. Crop face region using landmarks
    canvas = new OffscreenCanvas(128, 128);
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
    
    // Compute bbox from landmarks (simplified)
    const landmarks = result.faceLandmarks[0];
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    
    const srcX = minX * bitmap.width;
    const srcY = minY * bitmap.height;
    const srcW = (maxX - minX) * bitmap.width;
    const srcH = (maxY - minY) * bitmap.height;
    
    ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, 128, 128);

    // 3. Run face-api.js expression model on cropped face
    // Note: face-api.js can accept OffscreenCanvas directly
    const expressions = await faceapi.detectFaceExpressionsFromCanvas(canvas as unknown as HTMLCanvasElement);
    
    if (!expressions) {
      bitmap.close();
      return;
    }

    // 4. Map 7-emotion vector → 5-axis PATHOS delta
    const pathosDelta: PathosDelta = emotionToPathos(expressions);
    
    // 5. Compute confidence (max emotion probability)
    const confidence = Math.max(...Object.values(expressions));

    // 6. Post result — ONLY the 5-axis vector + scalars
    postMessage({
      type: 'PATHOS',
      delta: pathosDelta,
      confidence,
      timestamp,
    } satisfies OutboundMessage);

  } catch (err) {
    postMessage({
      type: 'ERROR',
      code: 'INFERENCE_FAILED',
      message: err instanceof Error ? err.message : String(err),
    } satisfies OutboundMessage);
  } finally {
    // 7. Dispose ALL resources — non-negotiable
    bitmap.close();
    if (canvas) {
      // OffscreenCanvas auto-collected · no explicit dispose API
      canvas = null;
    }
    if (ctx) ctx = null;
  }
}

self.onmessage = async (e: MessageEvent<InboundMessage>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'INIT':
      await init();
      break;
    case 'FRAME':
      await processFrame(msg.bitmap, msg.timestamp);
      break;
    case 'PAUSE':
      isPaused = true;
      break;
    case 'RESUME':
      isPaused = false;
      break;
    case 'SHUTDOWN':
      if (landmarker) {
        landmarker.close();
        landmarker = null;
      }
      self.close();
      break;
  }
};

export {};  // mark as module
```

---

## Main-Thread Driver (capture + throttle)

```typescript
// src/hooks/useFace2Feel.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useConsent } from './useConsent';
import type { PathosDelta } from '@/lib/biometrics/face2feel-types';

const FRAME_INTERVAL_MS = 200;  // 5 fps · LOCKED
const VIDEO_WIDTH = 320;        // LOCKED
const VIDEO_HEIGHT = 240;       // LOCKED

export function useFace2Feel() {
  const { tier } = useConsent('face2feel');
  const [isActive, setIsActive] = useState(false);
  const [lastDelta, setLastDelta] = useState<PathosDelta | null>(null);
  const [lastConfidence, setLastConfidence] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'SHUTDOWN' });
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    setIsActive(false);
    setLastDelta(null);
    setLastConfidence(0);
  }, []);

  useEffect(() => {
    if (tier === 'off') {
      teardown();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // 1. Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            frameRate: 5,
            facingMode: 'user',
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        // 2. Set up hidden video element
        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;
        document.body.appendChild(video);
        videoRef.current = video;
        await video.play();

        // 3. Spawn worker
        const worker = new Worker(new URL('/workers/face2feel.worker.js', import.meta.url), {
          type: 'module',
        });
        workerRef.current = worker;

        worker.onmessage = (e) => {
          const msg = e.data;
          if (msg.type === 'READY') {
            setIsActive(true);
          } else if (msg.type === 'PATHOS') {
            setLastDelta(msg.delta);
            setLastConfidence(msg.confidence);
            // PATHOS engine integration happens in 06-integration.md
          } else if (msg.type === 'ERROR') {
            console.error('[Face2Feel worker error]', msg);
          }
        };

        worker.postMessage({ type: 'INIT' });

        // 4. Frame capture loop · throttled to 5fps
        const loop = (now: number) => {
          if (cancelled) return;
          if (now - lastFrameRef.current >= FRAME_INTERVAL_MS && video.readyState >= 2) {
            lastFrameRef.current = now;
            createImageBitmap(video).then(bitmap => {
              worker.postMessage({ type: 'FRAME', bitmap, timestamp: now }, [bitmap]);
            }).catch(() => {/* swallow occasional capture races */});
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

      } catch (err) {
        console.error('[Face2Feel] init failed', err);
        teardown();
      }
    })();

    // Visibility handling
    const onVisibility = () => {
      if (!workerRef.current) return;
      workerRef.current.postMessage({
        type: document.visibilityState === 'hidden' ? 'PAUSE' : 'RESUME',
      });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      teardown();
    };
  }, [tier, teardown]);

  return {
    tier,
    isActive,
    lastDelta,
    lastConfidence,
    revoke: teardown,
  };
}
```

---

## window.__acai exposure

```typescript
// In App() root or _app.tsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  (window as any).__acai = (window as any).__acai ?? {};
  (window as any).__acai.face2feel = {
    get status() { return face2feel.tier; },
    get isActive() { return face2feel.isActive; },
    get lastPathosDelta() { return face2feel.lastDelta; },
    get lastConfidence() { return face2feel.lastConfidence; },
    revoke: face2feel.revoke,
  };
}, [face2feel]);
```

This satisfies the conformance matrix probe added in 06-integration.md.

---

## Acceptance

1. `useFace2Feel()` with tier='off' → worker never spawned, no `getUserMedia` call
2. `useFace2Feel()` with tier='session'/'persistent' → worker spawned, video element created, RAF loop running
3. Network tab during init: only same-origin `/models/face2feel/*` fetches
4. After consent revoke (`tier → 'off'`):
   - `MediaStream.getTracks()[*].readyState === 'ended'`
   - Worker terminated (verified by attempting to postMessage · errors)
   - `<video>` element removed from DOM
5. Tab hidden → worker receives 'PAUSE' · stops processing frames
6. Tab visible → worker receives 'RESUME' · resumes within 500ms
7. With face detected: PATHOS message received every ~200ms · confidence > 0.6
8. No face for 3s: single PATHOS message with `delta: null`, `confidence: 0`
9. `window.__acai.face2feel` object present · 5 properties as documented
10. Camera permission denied: `useFace2Feel()` returns `{ isActive: false, lastDelta: null }` · console error logged · no UI crash
11. **Critical:** `postMessage` payloads inspected via DevTools · NEVER contain `ImageBitmap`, `Float32Array`, or `landmarks` field on outbound messages
