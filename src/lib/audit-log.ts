/**
 * Audit log abstraction · Issue 4-A decision: AuditLog tab on the
 * Google Sheet is the canonical destination once the API surface lands.
 *
 * Today this layer:
 *   1. Always writes to localStorage immediately (sub-millisecond)
 *      so the CWH gate's compliance audit is durable across reloads.
 *   2. Best-effort POSTs to `/api/audit-log` so the server-side mirror
 *      can persist into the Sheets AuditLog tab (Phase 2). When the
 *      endpoint doesn't exist yet, the failure is swallowed without
 *      blocking the UI.
 *
 * Phase 2 will replace the POST stub with the real `/api/cwh/transition`
 * route that runs the gate server-side; this file's interface stays the
 * same so callers don't need to be touched again.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export type AuditEntry = {
  ts: string;
  actor: string;
  action: string;
  resource: string;
  before?: string | null;
  after?: string | null;
  reason?: string;
};

const STORAGE_KEY = 'acu-audit-log';
const MAX_ENTRIES = 500;

export function readAudit(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as AuditEntry[];
    return [];
  } catch {
    return [];
  }
}

export function appendAudit(entry: Omit<AuditEntry, 'ts'>): AuditEntry {
  const stamped: AuditEntry = { ...entry, ts: new Date().toISOString() };

  if (typeof window !== 'undefined') {
    try {
      const log = readAudit();
      log.unshift(stamped);
      while (log.length > MAX_ENTRIES) log.pop();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
      // localStorage may be unavailable in private browsing
    }

    // Best-effort sheet-side mirror — falls back silently when /api/audit-log
    // is not yet deployed (Phase 1B precedes the route).
    try {
      void fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stamped),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  return stamped;
}

export function clearAudit(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
