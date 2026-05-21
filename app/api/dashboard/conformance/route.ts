/**
 * GET /api/dashboard/conformance · operational metrics for the ACAI gauge.
 *
 * Phase 3b.03 · pulls last-24h CWH metrics from Postgres when available:
 *   - denyRate24h        — fraction of audit rows with verdict='deny'
 *   - p95LatencyMs       — best-effort estimate (latency_ms column lands in Phase 3c)
 *   - rateLimitHits24h   — placeholder (Phase 3c logs to a counter table)
 *
 * Gracefully degrades to `source: 'unavailable'` + operationalScore=100 when
 * POSTGRES_URL is unset · the gauge then falls back to structural-only.
 *
 * Article 22 boundary: this route REPORTS measurements · NEVER auto-decides.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

export type ConformanceOperational = {
  denyRate24h: number;
  p95LatencyMs: number;
  rateLimitHits24h: number;
  sampleSize: number;
  operationalScore: number;
  source: 'postgres' | 'unavailable';
};

function computeOperationalScore(
  denyRate: number,
  p95LatencyMs: number,
  rateLimitHits: number,
): number {
  let score = 100;
  if (denyRate > 0.05) score -= Math.min(30, (denyRate - 0.05) * 600);
  if (p95LatencyMs > 50) score -= Math.min(20, (p95LatencyMs - 50) * 0.4);
  if (rateLimitHits > 100) score -= Math.min(10, (rateLimitHits - 100) * 0.05);
  return Math.max(0, Math.min(100, score));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Graceful degradation when Postgres unset.
  if (!process.env.POSTGRES_URL || process.env.NEXT_RUNTIME === 'edge') {
    const result: ConformanceOperational = {
      denyRate24h: 0,
      p95LatencyMs: 0,
      rateLimitHits24h: 0,
      sampleSize: 0,
      operationalScore: 100,
      source: 'unavailable',
    };
    return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  let denyRate24h = 0;
  let sampleSize = 0;
  const p95LatencyMs = 12; // placeholder estimate · Phase 3c adds latency_ms column
  const rateLimitHits24h = 0;

  try {
    const { sql } = await import('@vercel/postgres');
    const denyResult = await sql`
      SELECT
        COUNT(*) FILTER (WHERE verdict = 'deny')::float / NULLIF(COUNT(*), 0) AS deny_rate,
        COUNT(*) AS total
      FROM audit_log
      WHERE ts > NOW() - INTERVAL '24 hours';
    `;
    denyRate24h = Number(denyResult.rows[0]?.deny_rate ?? 0);
    sampleSize = Number(denyResult.rows[0]?.total ?? 0);
  } catch (err) {
    console.warn('[conformance] postgres query failed · degrading to unavailable', err);
    const result: ConformanceOperational = {
      denyRate24h: 0,
      p95LatencyMs: 0,
      rateLimitHits24h: 0,
      sampleSize: 0,
      operationalScore: 100,
      source: 'unavailable',
    };
    return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  const result: ConformanceOperational = {
    denyRate24h,
    p95LatencyMs,
    rateLimitHits24h,
    sampleSize,
    operationalScore: computeOperationalScore(denyRate24h, p95LatencyMs, rateLimitHits24h),
    source: 'postgres',
  };

  return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
