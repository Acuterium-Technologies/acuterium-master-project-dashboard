/**
 * GET /api/auditlog/tail?limit=10 · Phase 3b.01.
 *
 * Returns the most recent N audit entries (max 50) for the live-tail
 * panel in the Dashboard-mode right rail.
 *
 * Source preference:
 *   1. Postgres (if POSTGRES_URL set and the query succeeds)
 *   2. JSONL fallback (current-day file)
 *   3. Empty + source='unavailable' (e.g. edge runtime)
 *
 * Bearer-cookie auth gated · NO CWH (read-only).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { readJsonlTail } from '../../../../src/lib/cwh/auditlog';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

export type TailEntry = {
  auditId: string;
  timestamp: string;
  target: string;
  verdict: string;
  ruleId: string;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '10');
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 10));

  // 1. Postgres path
  if (process.env.POSTGRES_URL && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      const { sql } = await import('@vercel/postgres');
      const result = await sql`
        SELECT audit_id, ts, target, verdict, rule_id
        FROM audit_log
        ORDER BY ts DESC
        LIMIT ${limit};
      `;
      const entries: TailEntry[] = result.rows.map((r) => ({
        auditId: String(r.audit_id),
        timestamp:
          r.ts instanceof Date ? r.ts.toISOString() : String(r.ts),
        target: String(r.target),
        verdict: String(r.verdict),
        ruleId: String(r.rule_id),
      }));
      return NextResponse.json(
        { entries, source: 'postgres' },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (err) {
      console.warn('[auditlog/tail] postgres failed · falling back to JSONL', err);
    }
  }

  // 2. JSONL fallback
  const entries = await readJsonlTail(limit);
  if (entries.length > 0) {
    return NextResponse.json(
      { entries, source: 'jsonl' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 3. Empty
  return NextResponse.json(
    { entries: [], source: 'unavailable' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
