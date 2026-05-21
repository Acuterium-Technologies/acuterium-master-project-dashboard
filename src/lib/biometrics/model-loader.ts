/**
 * Self-hosted ML model loader · Phase 3d-i.03.
 *
 * Lazy + idempotent — first call returns the active promise so multiple
 * call sites converge on a single download. Service worker (Phase 3d-i.03)
 * caches the responses; SW VERSION bump invalidates the cache automatically.
 *
 * D-09 quarantine: all bytes come from /models/face2feel/* on the same
 * origin. The upstream URLs are documented in the bundle's README and the
 * INTEGRITY.json hashes match the on-disk binaries.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import type { FaceLandmarker } from '@mediapipe/tasks-vision';

export const FACE2FEEL_MODELS_BASE = '/models/face2feel';

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
let faceApiPromise: Promise<typeof import('face-api.js')> | null = null;

export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const vision = await import('@mediapipe/tasks-vision');
    const fileset = await vision.FilesetResolver.forVisionTasks(
      `${FACE2FEEL_MODELS_BASE}/mediapipe`,
    );
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: `${FACE2FEEL_MODELS_BASE}/mediapipe/face_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.6,
      minFacePresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  })();

  return landmarkerPromise;
}

export async function loadFaceApi(): Promise<typeof import('face-api.js')> {
  if (faceApiPromise) return faceApiPromise;

  faceApiPromise = (async () => {
    const faceapi = await import('face-api.js');
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      `${FACE2FEEL_MODELS_BASE}/face-api`,
    );
    await faceapi.nets.faceExpressionNet.loadFromUri(
      `${FACE2FEEL_MODELS_BASE}/face-api`,
    );
    return faceapi;
  })();

  return faceApiPromise;
}

/**
 * Tear down both model handles. Called on consent revoke.
 * MediaPipe exposes an explicit close(); face-api.js relies on GC after
 * we drop the promise reference.
 */
export async function unloadModels(): Promise<void> {
  if (landmarkerPromise) {
    try {
      const lm = await landmarkerPromise;
      lm.close();
    } catch {
      /* ignore — already torn down */
    }
    landmarkerPromise = null;
  }
  faceApiPromise = null;
}
