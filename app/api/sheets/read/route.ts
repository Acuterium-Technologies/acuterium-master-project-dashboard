/**
 * GET /api/sheets/read?tab=<name> · Phase 3a.02.
 *
 * Bearer-cookie gated. No CWH gate (read-only).
 * Returns 503 with `{ fallback: true }` when env vars are missing — the
 * dashboard client treats this as "use static src/data/* fallback".
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  parseChannelRow,
  parseConflictRow,
  parseDecisionRow,
  parseKpiRow,
  parseMilestoneRow,
  parsePortfolioRow,
  parseSpineRow,
  parseSprintRow,
  parseSurfaceRow,
  parseTaskRow,
} from '../../../../src/lib/sheets/parsers';
import { readSheetTab } from '../../../../src/lib/sheets/read';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

const TAB_PARSERS: Record<string, (row: string[]) => unknown> = {
  tasks: parseTaskRow,
  milestones: parseMilestoneRow,
  decisions: parseDecisionRow,
  kpis: parseKpiRow,
  channels: parseChannelRow,
  portfolio: parsePortfolioRow,
  surfaces: parseSurfaceRow,
  conflicts: parseConflictRow,
  spine: parseSpineRow,
  sprints: parseSprintRow,
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const tab = req.nextUrl.searchParams.get('tab');
  if (!tab || !(tab in TAB_PARSERS)) {
    return NextResponse.json({ error: 'invalid tab' }, { status: 400 });
  }

  const data = await readSheetTab(tab, TAB_PARSERS[tab]);
  if (data === null) {
    return NextResponse.json(
      { error: 'sheets unavailable', fallback: true },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.json(
    { data },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
