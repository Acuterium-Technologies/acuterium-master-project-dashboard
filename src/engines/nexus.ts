/**
 * NEXUS · behavioral signal collector.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2407-2492 (verbatim port).
 *
 * Listens to mousemove, scroll, keydown, and touchstart with passive listeners
 * so the surface never blocks user input. Samples are kept in a useRef and
 * rolled up by a single 1.5-second setInterval into the exported
 * `NexusSignals` shape. The interval is also the only place we touch React
 * state — keyboard handlers do NOT setState on every keystroke (that's the
 * "don't thrash" guarantee).
 *
 * Touch-only input detection (`hasTouch=true`) promotes mode-tuui as a
 * candidate inside KAIROS auto-switch. Cleanup removes all listeners and
 * clears the interval on unmount.
 *
 * The setProfile callback receives an EMA of the rolling signals plus a
 * fresh lastSeen ISO timestamp, then persists via MNEMOS.save.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { MNEMOS } from './mnemos';
import type { MnemosProfile, NexusSignals } from './types';

type NexusInternal = {
  mouseX: number;
  mouseY: number;
  mouseLastT: number;
  mouseSamples: number[];
  scrollLastY: number;
  scrollLastT: number;
  scrollSamples: number[];
  keySamples: number[];
  keyLastT: number;
  lastInteract: number;
  hasMouse: boolean;
  hasTouch: boolean;
};

export function useNEXUS(setProfile: Dispatch<SetStateAction<MnemosProfile>>): NexusSignals {
  const sigRef = useRef<NexusInternal>({
    mouseX: 0,
    mouseY: 0,
    mouseLastT: 0,
    mouseSamples: [],
    scrollLastY: 0,
    scrollLastT: 0,
    scrollSamples: [],
    keySamples: [],
    keyLastT: 0,
    lastInteract: Date.now(),
    hasMouse: false,
    hasTouch: false,
  });
  const [signals, setSignals] = useState<NexusSignals>({
    mouseVel: 0,
    scrollVel: 0,
    keyCadence: 0,
    idleSeconds: 0,
    hasTouch: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = sigRef.current;

    const onMouseMove = (e: MouseEvent) => {
      s.hasMouse = true;
      s.lastInteract = Date.now();
      const now = performance.now();
      if (s.mouseLastT) {
        const dt = now - s.mouseLastT;
        const dx = e.clientX - s.mouseX;
        const dy = e.clientY - s.mouseY;
        const v = (Math.sqrt(dx * dx + dy * dy) / Math.max(dt, 1)) * 1000;
        s.mouseSamples.push(v);
        if (s.mouseSamples.length > 60) s.mouseSamples.shift();
      }
      s.mouseX = e.clientX;
      s.mouseY = e.clientY;
      s.mouseLastT = now;
    };

    const onScroll = () => {
      s.lastInteract = Date.now();
      const now = performance.now();
      const y = window.scrollY;
      if (s.scrollLastT) {
        const dt = now - s.scrollLastT;
        const dy = Math.abs(y - s.scrollLastY);
        const v = (dy / Math.max(dt, 1)) * 1000;
        s.scrollSamples.push(v);
        if (s.scrollSamples.length > 40) s.scrollSamples.shift();
      }
      s.scrollLastY = y;
      s.scrollLastT = now;
    };

    const onKey = () => {
      s.lastInteract = Date.now();
      const now = performance.now();
      if (s.keyLastT) {
        const dt = now - s.keyLastT;
        s.keySamples.push(dt);
        if (s.keySamples.length > 20) s.keySamples.shift();
      }
      s.keyLastT = now;
    };

    const onTouchStart = () => {
      s.hasTouch = true;
      s.lastInteract = Date.now();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    const t = window.setInterval(() => {
      const mouseVel = s.mouseSamples.length
        ? s.mouseSamples.reduce((a, b) => a + b, 0) / s.mouseSamples.length
        : 0;
      const scrollVel = s.scrollSamples.length
        ? s.scrollSamples.reduce((a, b) => a + b, 0) / s.scrollSamples.length
        : 0;
      const keyCadence = s.keySamples.length
        ? s.keySamples.reduce((a, b) => a + b, 0) / s.keySamples.length
        : 0;
      const idleSeconds = (Date.now() - s.lastInteract) / 1000;

      setSignals({
        mouseVel: Math.round(mouseVel),
        scrollVel: Math.round(scrollVel),
        keyCadence: Math.round(keyCadence),
        idleSeconds: Math.round(idleSeconds),
        hasTouch: s.hasTouch,
      });

      setProfile((p) => {
        const np: MnemosProfile = {
          ...p,
          avgMouseVel: Math.round((p.avgMouseVel || 0) * 0.85 + mouseVel * 0.15),
          avgScrollVel: Math.round((p.avgScrollVel || 0) * 0.85 + scrollVel * 0.15),
          keyCadenceMs: Math.round((p.keyCadenceMs || 0) * 0.85 + keyCadence * 0.15),
          idleSeconds: Math.round(idleSeconds),
          hasTouch: p.hasTouch || s.hasTouch,
          lastSeen: new Date().toISOString(),
        };
        MNEMOS.save(np);
        return np;
      });
    }, 1500);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.clearInterval(t);
    };
  }, [setProfile]);

  return signals;
}
