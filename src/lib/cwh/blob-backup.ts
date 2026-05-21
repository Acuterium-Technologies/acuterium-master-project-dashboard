/**
 * Vercel Blob mirror for the AuditLog · Phase 3a.01.
 *
 * Hourly cron uploads the current-day JSONL file to Vercel Blob under
 * `auditlog/auditlog-YYYY-MM-DD.jsonl`. Survives serverless cold-starts
 * (the JSONL on /tmp doesn't; Postgres is durable but Blob is the raw
 * forward-compat archive).
 *
 * Disabled unless AUDIT_BLOB_BACKUP_ENABLED=true. Failures are logged
 * but never propagated — backup is best-effort, JSONL + Postgres remain
 * the canonical paths.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { auditFilePath } from './auditlog';

export type BlobBackupResult = {
  uploaded: boolean;
  reason?: string;
  url?: string;
  date?: string;
};

function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function backupAuditLogToBlob(now: Date = new Date()): Promise<BlobBackupResult> {
  if (process.env.AUDIT_BLOB_BACKUP_ENABLED !== 'true') {
    return { uploaded: false, reason: 'AUDIT_BLOB_BACKUP_ENABLED!=true' };
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { uploaded: false, reason: 'BLOB_READ_WRITE_TOKEN unset' };
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    return { uploaded: false, reason: 'edge runtime · fs unavailable' };
  }

  const date = todayUTC(now);
  try {
    const { readFile } = await import('node:fs/promises');
    const path = auditFilePath(now);
    let content: string;
    try {
      content = await readFile(path, 'utf8');
    } catch {
      return { uploaded: false, reason: 'no JSONL for ' + date };
    }

    const { put } = await import('@vercel/blob');
    const result = await put(`auditlog/auditlog-${date}.jsonl`, content, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/x-ndjson',
    });
    return { uploaded: true, url: result.url, date };
  } catch (err) {
    console.error('[auditlog:blob] backup failed', err);
    return { uploaded: false, reason: String(err) };
  }
}
