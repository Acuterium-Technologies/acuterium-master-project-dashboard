/**
 * GET /api/cwh/idempotency/stats · dev-only inspection.
 * Phase 3a.04 acceptance criterion: cache size / hit-rate visibility.
 *
 * Returns 404 outside of dev to avoid surfacing internal state to operators.
 * Requires bearer cookie even in dev.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { idempotencyStats } from '../../../../../src/lib/cwh/idempotency';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  return NextResponse.json(idempotencyStats(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
