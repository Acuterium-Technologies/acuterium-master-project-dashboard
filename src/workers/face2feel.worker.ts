/**
 * Face2Feel · Web Worker · Phase 3d-i.04.
 *
 * Isolated inference loop. Receives ImageBitmap frames at 5 fps from the
 * main thread, runs MediaPipe Face Mesh detection + face-api.js emotion
 * classification, and posts ONLY a 5-axis PathosDelta + scalar confidence
 * back. Raw frames, landmark arrays, and emotion vectors NEVER cross
 * postMessage.
 *
 * Tensor lifecycle:
 *   - ImageBitmap.close() after every frame
 *   - landmarker.close() on SHUTDOWN
 *   - OffscreenCanvas is GC'd after the frame scope ends
 *   - face-api.js manages its own tensors via tfjs (no manual dispose API)
 *
 * Runtime risk · documented:
 *   face-api.js depends on TensorFlow.js which historically expected DOM.
 *   Inside a Web Worker, OffscreenCanvas substitutes for HTMLCanvasElement.
 *   If face-api.js init fails in the worker context (no `window`, no
 *   `document`), inference still proceeds with PathosDelta=null + ERROR
 *   posted. The hook gracefully stays in inactive state. Phase 3d-iv
 *   calibration panel can pivot to a worker-safe backbone (e.g. ONNX
 *   Runtime Web) if this is a recurring issue.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
/// <reference lib="webworker" />

import type {
  FaceLandmarker,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

import { emotionToPathos } from '../lib/biometrics/pathos-mapping';
import type {
  Face2FeelInbound,
  Face2FeelOutbound,
  PathosDelta,
} from '../lib/biometrics/face2feel-types';

const MODELS_BASE = '/models/face2feel';
const NO_FACE_TIMEOUT_MS = 3000;
const MIN_CONFIDENCE = 0.6;
const CROP_SIZE = 128;

let landmarker: FaceLandmarker | null = null;
let faceapi: typeof import('face-api.js') | null = null;
let isPaused = false;
let lastFaceTimestamp = 0;
let lastEmptyEmitTimestamp = 0;
let landmarkerReady = false;
let faceapiReady = false;

function post(message: Face2FeelOutbound, transfer: Transferable[] = []): void {
  try {
    (self as DedicatedWorkerGlobalScope).postMessage(message, transfer);
  } catch {
    /* swallow — worker shutting down */
  }
}

async function init(): Promise<void> {
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const fileset = await vision.FilesetResolver.forVisionTasks(
      `${MODELS_BASE}/mediapipe`,
    );
    landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: `${MODELS_BASE}/mediapipe/face_landmarker.task`,
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
    landmarkerReady = true;
  } catch (err) {
    post({
      type: 'ERROR',
      code: 'LANDMARKER_INIT_FAILED',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const mod = await import('face-api.js');
    await mod.nets.tinyFaceDetector.loadFromUri(`${MODELS_BASE}/face-api`);
    await mod.nets.faceExpressionNet.loadFromUri(`${MODELS_BASE}/face-api`);
    faceapi = mod;
    faceapiReady = true;
  } catch (err) {
    post({
      type: 'ERROR',
      code: 'FACEAPI_INIT_FAILED',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  post({ type: 'READY' });
}

function bboxFromLandmarks(
  landmarks: Array<{ x: number; y: number }>,
  bitmapWidth: number,
  bitmapHeight: number,
): { x: number; y: number; w: number; h: number } {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: Math.max(0, minX * bitmapWidth),
    y: Math.max(0, minY * bitmapHeight),
    w: Math.max(1, (maxX - minX) * bitmapWidth),
    h: Math.max(1, (maxY - minY) * bitmapHeight),
  };
}

async function processFrame(bitmap: ImageBitmap, timestamp: number): Promise<void> {
  if (!landmarker || !landmarkerReady || isPaused) {
    bitmap.close();
    return;
  }

  try {
    const result: FaceLandmarkerResult = landmarker.detectForVideo(bitmap, timestamp);

    if (!result.faceLandmarks?.length) {
      // No face detected; emit null sample at most every NO_FACE_TIMEOUT_MS so
      // the bars hold last-known PATHOS rather than oscillating.
      const dtFromLastFace = timestamp - lastFaceTimestamp;
      const dtFromLastEmpty = timestamp - lastEmptyEmitTimestamp;
      if (dtFromLastFace > NO_FACE_TIMEOUT_MS && dtFromLastEmpty > NO_FACE_TIMEOUT_MS) {
        lastEmptyEmitTimestamp = timestamp;
        post({ type: 'PATHOS', delta: null, confidence: 0, timestamp });
      }
      return;
    }

    lastFaceTimestamp = timestamp;

    if (!faceapi || !faceapiReady) {
      // Detection works but emotion model failed to init — emit detection-only
      // signal: confidence 0 (caller treats as observation-only).
      post({ type: 'PATHOS', delta: null, confidence: 0, timestamp });
      return;
    }

    const canvas = new OffscreenCanvas(CROP_SIZE, CROP_SIZE);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      post({ type: 'PATHOS', delta: null, confidence: 0, timestamp });
      return;
    }

    const bbox = bboxFromLandmarks(result.faceLandmarks[0], bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, CROP_SIZE, CROP_SIZE);

    // face-api.js' detectAllFaces + withFaceExpressions returns an array
    // of detection objects with .expressions. We feed the cropped face
    // directly; tinyFaceDetector + faceExpressionNet are both small.
    // face-api.js types don't accept OffscreenCanvas in its TS declarations,
    // but the runtime accepts any canvas-like input.
    type FaceApiFluent = {
      withFaceExpressions: () => Promise<Array<{ expressions?: Record<string, number> }>>;
    };
    type FaceApiModule = {
      detectAllFaces: (input: unknown, options: unknown) => FaceApiFluent;
      TinyFaceDetectorOptions: new (opts: { inputSize: number; scoreThreshold: number }) => unknown;
    };
    const fa = faceapi as unknown as FaceApiModule;
    const detection = await fa
      .detectAllFaces(canvas, new fa.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 }))
      .withFaceExpressions();

    if (!detection || detection.length === 0 || !detection[0]?.expressions) {
      post({ type: 'PATHOS', delta: null, confidence: 0, timestamp });
      return;
    }

    const expressions = detection[0].expressions as Record<string, number>;
    const delta: PathosDelta = emotionToPathos({
      neutral: expressions.neutral ?? 0,
      happy: expressions.happy ?? 0,
      sad: expressions.sad ?? 0,
      angry: expressions.angry ?? 0,
      fearful: expressions.fearful ?? 0,
      disgusted: expressions.disgusted ?? 0,
      surprised: expressions.surprised ?? 0,
    });
    const confidence = Math.max(...Object.values(expressions));

    post({ type: 'PATHOS', delta, confidence, timestamp });
  } catch (err) {
    post({
      type: 'ERROR',
      code: 'INFERENCE_FAILED',
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    bitmap.close();
  }
}

self.onmessage = (e: MessageEvent<Face2FeelInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'INIT':
      void init();
      break;
    case 'FRAME':
      void processFrame(msg.bitmap, msg.timestamp);
      break;
    case 'PAUSE':
      isPaused = true;
      break;
    case 'RESUME':
      isPaused = false;
      break;
    case 'SHUTDOWN':
      if (landmarker) {
        try {
          landmarker.close();
        } catch {
          /* already closed */
        }
        landmarker = null;
      }
      faceapi = null;
      landmarkerReady = false;
      faceapiReady = false;
      (self as DedicatedWorkerGlobalScope).close();
      break;
  }
};

// Mark this file as a TypeScript module so Next.js + Webpack compile it
// via the Worker plugin instead of treating it as a script.
export {};
