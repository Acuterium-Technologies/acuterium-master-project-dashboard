/**
 * AuditLog live tail panel · Phase 3b.01.
 *
 * Polls /api/auditlog/tail every 5s, shows last 10 entries with
 * verdict-coloured left border (allow=green / deny=red). Polling pauses
 * automatically while the tab is hidden (visibilitychange).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef, useState } from 'react';

type Entry = {
  auditId: string;
  timestamp: string;
  target: string;
  verdict: string;
  ruleId: string;
};

type TailResponse = {
  entries: Entry[];
  source: 'postgres' | 'jsonl' | 'unavailable';
};

const REFRESH_MS = 5_000;

export function AuditLogTail() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [source, setSource] = useState<TailResponse['source']>('unavailable');
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function fetchTail() {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/auditlog/tail?limit=10', { credentials: 'include' });
        if (!res.ok || cancelledRef.current) return;
        const json = (await res.json()) as TailResponse;
        if (cancelledRef.current) return;
        if (Array.isArray(json.entries)) {
          setEntries(json.entries);
          setSource(json.source);
        }
      } catch {
        // Silent · this is a passive read panel
      }
    }

    fetchTail();
    let timer: ReturnType<typeof setInterval> | null = setInterval(fetchTail, REFRESH_MS);

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        fetchTail();
        if (!timer) timer = setInterval(fetchTail, REFRESH_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelledRef.current = true;
      if (timer) clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, []);

  if (entries.length === 0) {
    return (
      <p className="acu-auditlog-tail__empty muted mono xs">
        Audit log tail · {source === 'unavailable' ? 'no source available' : 'awaiting first entry'}
      </p>
    );
  }

  return (
    <>
      <ul className="acu-auditlog-tail__list">
        {entries.map((e) => (
          <li key={e.auditId} className={`acu-auditlog-tail__item is-${e.verdict}`}>
            <span className="acu-auditlog-tail__time">
              {new Date(e.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
            </span>
            <span className="acu-auditlog-tail__target" title={e.target}>
              {e.target}
            </span>
            <span className="acu-auditlog-tail__rule">{e.ruleId}</span>
          </li>
        ))}
      </ul>
      <div className="acu-auditlog-tail__source mono xs muted">source · {source}</div>
    </>
  );
}
