import { NextRequest, NextResponse } from 'next/server';
import { readMatrix, readTasks, readMilestones, readKpis, updateTaskDone, updateMilestoneClosed, updateKpiValue, appendAuditLog } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [matrix, tasks, milestones, kpis] = await Promise.all([
      readMatrix(), readTasks(), readMilestones(), readKpis()
    ]);
    return NextResponse.json({ matrix, tasks, milestones, kpis });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { op, id } = body;

    if (op === 'task') {
      await updateTaskDone(id, body.done);
      await appendAuditLog('operator', 'task-toggle', id, String(!body.done), String(body.done));
    } else if (op === 'milestone') {
      await updateMilestoneClosed(id, body.closed);
      await appendAuditLog('operator', 'milestone-toggle', id, String(!body.closed), String(body.closed));
    } else if (op === 'kpi') {
      await updateKpiValue(id, body.value);
      await appendAuditLog('operator', 'kpi-edit', id, '', body.value);
    } else {
      return NextResponse.json({ error: 'Unknown op' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('POST /api/sheet error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
