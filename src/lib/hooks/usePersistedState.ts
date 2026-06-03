/**
 * usePersistedState — dual-layer persistence for the Master Ops dashboard.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1365-1398.
 *
 * Layer 1: localStorage (always, immediate).
 * Layer 2: window.storage shared-mode (when available — the v1.3 HTML
 *          relied on a Claude-injected shared storage bridge that exposes
 *          a {get,set} promise interface; the dashboard works without it).
 *
 * Returns the four toggle helpers used across the mode components plus a
 * reset and last-saved timestamp. Persistence is keyed by `acu-master-ops:v1`
 * so future migrations can bump the suffix without colliding with v1.3 data.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { TASKS } from '../../data';
import type { PersistedState, ResidueVerdict } from '../../data/types';

const STORAGE_KEY = 'acu-master-ops:v1';

/**
 * Curated done-state baseline. Tasks shipped as `done:true` in the seed
 * (e.g. completed Phase 0 pre-flight, ACAI Phase A, platform integrations)
 * render checked from first paint. Stored user toggles always layer ON TOP,
 * so un-ticking a curated task and any operator progress are preserved.
 */
const SEED_DONE: Record<string, boolean> = Object.fromEntries(
  TASKS.filter((t) => t.done).map((t) => [t.id, true]),
);

const INITIAL: PersistedState = {
  done: { ...SEED_DONE },
  closedMs: {},
  closedODs: {},
  residueVerdict: 'NOT-RUN',
};

// Best-effort shape narrowing for the optional shared-storage bridge.
type SharedStorage = {
  get: (key: string, sync?: boolean) => Promise<{ value?: string } | null>;
  set: (key: string, value: string, sync?: boolean) => Promise<unknown>;
};

function getSharedStorage(): SharedStorage | null {
  if (typeof window === 'undefined') return null;
  const ws = (window as unknown as { storage?: Partial<SharedStorage> }).storage;
  if (ws && typeof ws.get === 'function' && typeof ws.set === 'function') {
    return ws as SharedStorage;
  }
  return null;
}

export type UsePersistedState = {
  state: PersistedState;
  lastSaved: string | null;
  toggleTask: (id: string) => void;
  toggleMilestone: (id: string) => void;
  toggleOD: (id: string) => void;
  setResidue: (v: ResidueVerdict) => void;
  resetAll: () => void;
};

export function usePersistedState(): UsePersistedState {
  const [state, setState] = useState<PersistedState>(INITIAL);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Hydrate from localStorage + shared bridge on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        setState((s) => ({ ...s, ...parsed, done: { ...s.done, ...(parsed.done ?? {}) } }));
      }
    } catch {
      // ignore parse errors — keep INITIAL
    }

    const shared = getSharedStorage();
    if (shared) {
      shared
        .get(STORAGE_KEY, true)
        .then((r) => {
          if (r && r.value) {
            try {
              const parsed = JSON.parse(r.value) as Partial<PersistedState>;
              setState((s) => ({ ...s, ...parsed, done: { ...s.done, ...(parsed.done ?? {}) } }));
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const save = useCallback((next: PersistedState) => {
    const ts = new Date().toISOString();
    setLastSaved(ts);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
    const shared = getSharedStorage();
    if (shared) {
      shared.set(STORAGE_KEY, JSON.stringify(next), true).catch(() => {});
    }
  }, []);

  const toggleTask = useCallback(
    (id: string) =>
      setState((s) => {
        const n: PersistedState = { ...s, done: { ...s.done, [id]: !s.done[id] } };
        save(n);
        return n;
      }),
    [save],
  );

  const toggleMilestone = useCallback(
    (id: string) =>
      setState((s) => {
        const n: PersistedState = { ...s, closedMs: { ...s.closedMs, [id]: !s.closedMs[id] } };
        save(n);
        return n;
      }),
    [save],
  );

  const toggleOD = useCallback(
    (id: string) =>
      setState((s) => {
        const n: PersistedState = { ...s, closedODs: { ...s.closedODs, [id]: !s.closedODs[id] } };
        save(n);
        return n;
      }),
    [save],
  );

  const setResidue = useCallback(
    (v: ResidueVerdict) =>
      setState((s) => {
        const n: PersistedState = { ...s, residueVerdict: v };
        save(n);
        return n;
      }),
    [save],
  );

  const resetAll = useCallback(() => {
    const n: PersistedState = { ...INITIAL };
    setState(n);
    save(n);
  }, [save]);

  return { state, lastSaved, toggleTask, toggleMilestone, toggleOD, setResidue, resetAll };
}
