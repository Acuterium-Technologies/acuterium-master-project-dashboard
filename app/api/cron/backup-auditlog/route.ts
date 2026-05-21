/**
 * GET /api/cron/backup-auditlog · hourly cron entry point.
 * Phase 3a.01 · uploads the current day's JSONL to Vercel Blob.
 *
 * Vercel's cron protocol sends an Authorization: Bearer <CRON_SECRET>
 * header; we verify that to keep this endpoint from being callable by
 * outside parties (even though it's only a read+upload of audit data,
 * it should be machine-only).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backupAuditLogToBlob } from '../../../../src/lib/cwh/blob-backup';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
  }
  const result = await backupAuditLogToBlob();
  return NextResponse.json(result, { status: 200 });
}
