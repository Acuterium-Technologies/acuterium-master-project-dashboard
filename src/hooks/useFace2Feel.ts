/**
 * useFace2Feel · Phase 3d-i.04.
 *
 * Main-thread driver for the Face2Feel sensor channel:
 *   1. Reads consent tier via useConsent('face2feel') — no upgrades
 *   2. When tier ≠ off: getUserMedia(320×240 @ 5fps) + hidden <video>
 *   3. Spawns the inference worker (src/workers/face2feel.worker.ts)
 *   4. RAF throttle posts ImageBitmap frames at 200 ms
 *   5. Worker posts back PathosDelta + scalar confidence; never raw data
 *   6. visibilitychange: pause/resume worker
 *   7. Consent revoke: full teardown (stream stop · worker terminate ·
 *      hidden video remove · state reset)
 *
 * Graceful fallback: if getUserMedia, worker init, or model load fails,
 * the hook stays in { isActive: false, lastDelta: null }. Errors are
 * console-logged for the operator's DevTools session but never surface
 * as UI crashes.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useConsent } from './useConsent';
import type {
  Face2FeelInbound,
  Face2FeelOutbound,
  PathosDelta,
} from '../lib/biometrics/face2feel-types';

const FRAME_INTERVAL_MS = 200;
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
const TARGET_FRAME_RATE = 5;

export interface UseFace2FeelResult {
  tier: 'off' | 'session' | 'persistent';
  isActive: boolean;
  lastDelta: PathosDelta | null;
  lastConfidence: number;
  revoke: () => void;
}

export function useFace2Feel(): UseFace2FeelResult {
  const consent = useConsent('face2feel');
  const [isActive, setIsActive] = useState(false);
  const [lastDelta, setLastDelta] = useState<PathosDelta | null>(null);
  const [lastConfidence, setLastConfidence] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (workerRef.current) {
      try {
        workerRef.current.postMessage({ type: 'SHUTDOWN' } satisfies Face2FeelInbound);
      } catch {
        /* worker may already be dead */
      }
      try {
        workerRef.current.terminate();
      } catch {
        /* swallow */
      }
      workerRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        /* swallow */
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
      } catch {
        /* swallow */
      }
      videoRef.current = null;
    }

    setIsActive(false);
    setLastDelta(null);
    setLastConfidence(0);
  }, []);

  // Revoke (for the consumer + window.__acai.face2feel.revoke) clears
  // consent through to the storage state machine AND tears down the
  // sensor pipeline in one shot.
  const revoke = useCallback(() => {
    consent.revoke();
    teardown();
  }, [consent, teardown]);

  useEffect(() => {
    if (!consent.hydrated) return;
    if (consent.tier === 'off') {
      teardown();
      return;
    }

    let cancelled = false;
    let onVisibility: (() => void) | null = null;

    (async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('mediaDevices unavailable');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            frameRate: TARGET_FRAME_RATE,
            facingMode: 'user',
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;
        document.body.appendChild(video);
        videoRef.current = video;
        try {
          await video.play();
        } catch {
          /* autoplay may need a tick; the RAF loop still pulls frames */
        }

        const worker = new Worker(
          new URL('../workers/face2feel.worker.ts', import.meta.url),
          { type: 'module' },
        );
        workerRef.current = worker;

        worker.onmessage = (ev: MessageEvent<Face2FeelOutbound>) => {
          if (cancelled) return;
          const msg = ev.data;
          if (msg.type === 'READY') {
            setIsActive(true);
          } else if (msg.type === 'PATHOS') {
            setLastDelta(msg.delta);
            setLastConfidence(msg.confidence);
          } else if (msg.type === 'ERROR') {
            // Surface the error in the operator's console; UI stays inactive.
            // eslint-disable-next-line no-console
            console.warn('[Face2Feel worker]', msg.code, msg.message);
          }
        };

        worker.postMessage({ type: 'INIT' } satisfies Face2FeelInbound);

        const loop = (now: number) => {
          if (cancelled) return;
          if (
            now - lastFrameRef.current >= FRAME_INTERVAL_MS &&
            video.readyState >= 2 &&
            workerRef.current
          ) {
            lastFrameRef.current = now;
            createImageBitmap(video)
              .then((bitmap) => {
                if (cancelled || !workerRef.current) {
                  bitmap.close();
                  return;
                }
                workerRef.current.postMessage(
                  { type: 'FRAME', bitmap, timestamp: now } satisfies Face2FeelInbound,
                  [bitmap],
                );
              })
              .catch(() => {
                /* swallow occasional capture races */
              });
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        onVisibility = () => {
          const w = workerRef.current;
          if (!w) return;
          try {
            w.postMessage({
              type: document.visibilityState === 'hidden' ? 'PAUSE' : 'RESUME',
            } satisfies Face2FeelInbound);
          } catch {
            /* worker dead */
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Face2Feel] init failed', err);
        teardown();
      }
    })();

    return () => {
      cancelled = true;
      if (onVisibility) {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      teardown();
    };
  }, [consent.hydrated, consent.tier, teardown]);

  return {
    tier: consent.tier,
    isActive,
    lastDelta,
    lastConfidence,
    revoke,
  };
}
