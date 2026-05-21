/**
 * useSheetsData · Phase 3a.02.
 *
 * Polls /api/sheets/read every 30s for the named tab. Falls back to the
 * supplied static array on auth-loss, network failure, or 503 fallback.
 * Polling pauses while the tab is hidden (`document.visibilityState`).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

export type UseSheetsDataResult<T> = {
  data: T[];
  loading: boolean;
  fromSheets: boolean;
};

export function useSheetsData<T>(tabName: string, fallback: T[]): UseSheetsDataResult<T> {
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [fromSheets, setFromSheets] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function fetchOnce(): Promise<void> {
      try {
        const response = await fetch(`/api/sheets/read?tab=${encodeURIComponent(tabName)}`, {
          credentials: 'include',
        });
        if (cancelledRef.current) return;
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const json = (await response.json()) as { data?: T[] };
        if (cancelledRef.current) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data);
          setFromSheets(true);
        }
        setLoading(false);
      } catch (err) {
        console.warn(`[useSheetsData] ${tabName} fetch failed, using fallback`, err);
        if (!cancelledRef.current) setLoading(false);
      }
    }

    fetchOnce();

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        fetchOnce();
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    start();

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        fetchOnce();
        start();
      } else {
        stop();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelledRef.current = true;
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [tabName]);

  return { data, loading, fromSheets };
}
