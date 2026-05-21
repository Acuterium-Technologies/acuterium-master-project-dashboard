/**
 * POST /api/sheets/update · Phase 3a.02.
 *
 * Bearer-cookie auth + CWH gate (same 12 rules as /api/cwh/transition).
 *
 * Request body: target (one of the 6 *-update variants), targetId, field,
 * newValue, actor (session + 5-axis pathos), context (kairosMode +
 * doctrineScore). The route maps target to the Phase 2 base target by
 * stripping `-update`, evaluates CWH, persists an audit row regardless
 * of the Sheets call outcome, then writes the cell if the verdict was
 * allow. Sheets write failure still produces a valid audit row.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  appendAuditEntry,
  appendAuditPostgres,
  newAuditId,
  type AuditEntry,
} from '../../../../src/lib/cwh/auditlog';
import { evaluateCWH } from '../../../../src/lib/cwh/evaluate';
import {
  KAIROS_MODES_API,
  type CWHRuleId,
  type TransitionRequest,
} from '../../../../src/lib/cwh/types';
import { writeSheetCell } from '../../../../src/lib/sheets/write';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

const UPDATE_TARGETS = [
  'task-update',
  'kpi-update',
  'od-update',
  'milestone-update',
  'residue-update',
  'surface-update',
] as const;
type UpdateTarget = (typeof UPDATE_TARGETS)[number];

// Map *-update targets → Phase 2 base target for evaluator + canonical sheet tab name.
const BASE_TARGET: Record<UpdateTarget, TransitionRequest['target']> = {
  'task-update': 'task',
  'kpi-update': 'task', // KPI updates evaluate under the task default (CWH-R-12 catches them)
  'od-update': 'od',
  'milestone-update': 'milestone',
  'residue-update': 'residue',
  'surface-update': 'task',
};

const SHEET_TAB: Record<UpdateTarget, string> = {
  'task-update': 'tasks',
  'kpi-update': 'kpis',
  'od-update': 'decisions',
  'milestone-update': 'milestones',
  'residue-update': 'channels',
  'surface-update': 'surfaces',
};

const PathosSchema = z.object({
  stress: z.number().min(0).max(100),
  focus: z.number().min(0).max(100),
  curiosity: z.number().min(0).max(100),
  fatigue: z.number().min(0).max(100),
  satisfaction: z.number().min(0).max(100),
});

const UpdateRequestSchema = z.object({
  target: z.enum(UPDATE_TARGETS),
  targetId: z.string().min(1).max(64),
  field: z.string().min(1).max(64),
  newValue: z.string().max(512),
  actor: z.object({ session: z.string().min(1).max(128), pathos: PathosSchema }),
  context: z.object({
    kairosMode: z.enum(KAIROS_MODES_API),
    doctrineScore: z.number().min(0).max(100),
  }),
});

function newRequestId(): string {
  return 'req_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = newRequestId();

  // Auth
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json(
      { error: 'unauthenticated', code: 'UNAUTHENTICATED', requestId },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid JSON body', code: 'INVALID_INPUT', requestId },
      { status: 400 },
    );
  }

  const parsed = UpdateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          'schema validation failed: ' +
          parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join(' · '),
        code: 'INVALID_INPUT',
        requestId,
      },
      { status: 400 },
    );
  }

  const updateTarget = parsed.data.target;
  const baseTarget = BASE_TARGET[updateTarget];

  // Reuse Phase 2 CWH evaluator. We synthesise a TransitionRequest with
  // fromState='(read)' and toState=newValue so the evaluator's standard
  // pathways apply. Update targets fall through to CWH-R-12 default
  // allow unless stress > 90 / fatigue > 85 etc. fire upstream rules.
  const cwhInput: TransitionRequest = {
    target: baseTarget,
    targetId: parsed.data.targetId,
    fromState: '(read)',
    toState: parsed.data.newValue,
    actor: parsed.data.actor,
    context: parsed.data.context,
  };
  const verdict = evaluateCWH(cwhInput);

  const auditId = newAuditId();
  const timestamp = new Date().toISOString();
  const auditEntry: AuditEntry = {
    auditId,
    timestamp,
    request: { ...cwhInput, target: updateTarget }, // preserve original *-update target in the audit
    verdict: verdict.verdict,
    ruleId: verdict.ruleId as CWHRuleId,
    doctrineDelta: verdict.doctrineDelta,
    reason: verdict.reason,
  };
  await Promise.all([appendAuditEntry(auditEntry), appendAuditPostgres(auditEntry)]);

  if (verdict.verdict === 'deny') {
    return NextResponse.json(
      {
        verdict: 'deny',
        ruleId: verdict.ruleId,
        reason: verdict.reason,
        auditId,
        timestamp,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Allowed · attempt the Sheets write.
  const tab = SHEET_TAB[updateTarget];
  const writeResult = await writeSheetCell(
    tab,
    parsed.data.targetId,
    parsed.data.field,
    parsed.data.newValue,
  );
  if (!writeResult.ok) {
    return NextResponse.json(
      {
        verdict: 'allow',
        ruleId: verdict.ruleId,
        auditId,
        timestamp,
        error: 'sheets write failed',
        reason: writeResult.reason,
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { verdict: 'allow', ruleId: verdict.ruleId, auditId, timestamp },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
