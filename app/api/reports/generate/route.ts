/**
 * POST /api/reports/generate · REPORTS tab backend.
 *
 * Cookie-gated (same `acuterium-access` gate as every other route). Pulls the
 * LIVE Google Sheet (Tasks · Milestones · KPIs · Matrix) via the service
 * account, reconciles it against the committed source-of-record + doctrine,
 * and returns BOTH a structured payload (for the on-screen visual report) and
 * a full markdown document (for the .md download). Each generation appends an
 * audit entry so the changelog/AuditLog grows in real time.
 *
 * Falls back to the static src/data/*.ts seed when the Sheet is not configured
 * (graceful degradation) and flags the downgrade in the report.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSheetsClient, getSheetId } from '../../../../src/lib/sheets/client';
import {
  appendAuditEntry,
  appendAuditPostgres,
  newAuditId,
  readJsonlTail,
  type AuditEntry,
} from '../../../../src/lib/cwh/auditlog';
import { TASKS } from '../../../../src/data/tasks';
import { MILESTONES } from '../../../../src/data/milestones';
import { KPIS } from '../../../../src/data/kpis';
import { SURFACES } from '../../../../src/data/surfaces';
import { DECISIONS } from '../../../../src/data/decisions';
import { PORTFOLIO } from '../../../../src/data/portfolio';
import { ENGINEERING_LOG } from '../../../../src/data/engineering-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'acuterium-access';
const SHEET_TABS = ['Tasks', 'Milestones', 'KPIs', 'Matrix'] as const;

type Row = string[];
type TabData = Record<string, Row[]>;

async function readAllTabs(): Promise<{ data: TabData; source: 'sheet' | 'static-fallback' }> {
  const client = getSheetsClient();
  const sheetId = getSheetId();
  if (!client || !sheetId) return { data: {}, source: 'static-fallback' };
  const data: TabData = {};
  try {
    for (const tab of SHEET_TABS) {
      const r = await client.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A1:Z300` });
      data[tab] = (r.data.values ?? []) as Row[];
    }
    return { data, source: 'sheet' };
  } catch {
    return { data: {}, source: 'static-fallback' };
  }
}

function col(headers: Row, name: string): number {
  return headers.indexOf(name);
}

function isTrue(v: string | undefined): boolean {
  return String(v ?? '').trim().toUpperCase() === 'TRUE';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth — same fail-closed cookie gate as the rest of the surface.
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { data, source } = await readAllTabs();

  // ── Tasks ──────────────────────────────────────────────────────────────
  let tasksDone = 0;
  let tasksTotal = 0;
  if (source === 'sheet' && data.Tasks?.length) {
    const [h, ...rows] = data.Tasks;
    const dc = col(h, 'done');
    tasksTotal = rows.filter((r) => r[0]).length;
    tasksDone = rows.filter((r) => isTrue(r[dc])).length;
  } else {
    tasksTotal = TASKS.length;
    tasksDone = TASKS.filter((t) => t.done).length;
  }

  // ── Milestones ─────────────────────────────────────────────────────────
  let msClosed = 0;
  let msTotal = 0;
  const milestoneRows: { id: string; title: string; closed: boolean }[] = [];
  if (source === 'sheet' && data.Milestones?.length) {
    const [h, ...rows] = data.Milestones;
    const cc = col(h, 'closed');
    const tc = col(h, 'title');
    for (const r of rows) {
      if (!r[0]) continue;
      const closed = isTrue(r[cc]);
      milestoneRows.push({ id: r[0], title: r[tc] ?? '', closed });
      msTotal++;
      if (closed) msClosed++;
    }
  } else {
    for (const m of MILESTONES) {
      const closed = String(m.status).toUpperCase() === 'CLOSED';
      milestoneRows.push({ id: m.id, title: m.title, closed });
      msTotal++;
      if (closed) msClosed++;
    }
  }

  // ── KPIs ───────────────────────────────────────────────────────────────
  const kpiRows: { id: string; name: string; target: string; value: string; state: string }[] = [];
  if (source === 'sheet' && data.KPIs?.length) {
    const [h, ...rows] = data.KPIs;
    const ni = col(h, 'name');
    const ti = col(h, 'target');
    const vi = col(h, 'value');
    for (const r of rows) {
      if (!r[0]) continue;
      const value = String(r[vi] ?? '').trim();
      const target = String(r[ti] ?? '').trim();
      const state = deriveKpiState(value, target);
      kpiRows.push({ id: r[0], name: r[ni] ?? '', target, value, state });
    }
  } else {
    for (const k of KPIS) {
      const value = String((k as { value?: string }).value ?? '');
      const target = String((k as { target?: string }).target ?? '');
      kpiRows.push({ id: k.id, name: (k as { name?: string }).name ?? '', target, value, state: deriveKpiState(value, target) });
    }
  }
  const kpiAchieved = kpiRows.filter((k) => k.state === 'ACHIEVED').length;
  const kpiPending = kpiRows.filter((k) => k.state !== 'ACHIEVED').length;

  // ── Matrix ─────────────────────────────────────────────────────────────
  const matrixRows = source === 'sheet' && data.Matrix?.length
    ? data.Matrix.slice(1).filter((r) => r[0]).length
    : PORTFOLIO.length;

  // ── Owner decisions (Sheet has no tab — source-of-record is decisions.ts)
  const odClosed = DECISIONS.filter((d) => String((d as { status?: string }).status).toLowerCase() !== 'open').length;
  const odTotal = DECISIONS.length;

  // ── Recent activity (changelog, real-time) ──────────────────────────────
  let recentAudit: Array<{ timestamp?: string; target?: string; verdict?: string }> = [];
  try {
    recentAudit = await readJsonlTail(8);
  } catch {
    recentAudit = [];
  }

  const generatedAt = new Date().toISOString();
  const dateStr = generatedAt.slice(0, 10);

  const metrics = {
    tasks: { done: tasksDone, total: tasksTotal },
    milestones: { closed: msClosed, total: msTotal },
    matrix: { rows: matrixRows, target: 80 },
    kpis: { total: kpiRows.length, achieved: kpiAchieved, pending: kpiPending },
    decisions: { closed: odClosed, total: odTotal },
  };

  const surfaces = SURFACES.map((s) => ({
    name: s.name,
    url: s.url,
    host: s.host,
    announce: (s as { announce?: string }).announce ?? '',
    residue: (s as { residue?: string }).residue ?? '',
  }));

  const markdown = buildMarkdown({ generatedAt, dateStr, source, metrics, kpiRows, milestoneRows, surfaces, recentAudit });

  // Append an audit entry so the changelog records every generation in real time.
  try {
    const auditId = newAuditId();
    const entry: AuditEntry = {
      auditId,
      timestamp: generatedAt,
      request: {
        target: 'task',
        targetId: 'REPORT',
        fromState: '(read)',
        toState: `report:${dateStr}`,
        actor: { session: 'reports-tab', pathos: { stress: 0, focus: 0, curiosity: 0, fatigue: 0, satisfaction: 0 } },
        context: { kairosMode: 'Dashboard', doctrineScore: 0 },
      },
      verdict: 'allow',
      ruleId: 'CWH-R-12',
      doctrineDelta: 0,
      reason: 'master-ops report generated',
    };
    await Promise.all([appendAuditEntry(entry), appendAuditPostgres(entry)]);
  } catch {
    /* best-effort changelog — never block the report */
  }

  return NextResponse.json(
    { generatedAt, date: dateStr, source, metrics, kpis: kpiRows, milestones: milestoneRows, surfaces, recentAudit, markdown },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

function deriveKpiState(value: string, target: string): 'ACHIEVED' | 'ON TRACK' | 'AT RISK' | 'OFF TRACK' {
  const v = value.toLowerCase();
  if (v === 'pending' || v === '' ) return 'AT RISK';
  if (v === '0' || v === '0%' || v === '0 of 13' || v.startsWith('0 ')) return 'OFF TRACK';
  // "9 of 9" / "X of X" → achieved
  const m = value.match(/^(\d+)\s*(?:of|\/)\s*(\d+)/i);
  if (m && m[1] === m[2]) return 'ACHIEVED';
  if (/^(yes|achieved|verified|issued|live|stage 2 live)/i.test(value)) return 'ACHIEVED';
  return 'ON TRACK';
}

function pct(n: number, d: number): string {
  return d > 0 ? Math.round((n / d) * 100) + '%' : '0%';
}

type ReportMetrics = {
  tasks: { done: number; total: number };
  milestones: { closed: number; total: number };
  matrix: { rows: number; target: number };
  kpis: { total: number; achieved: number; pending: number };
  decisions: { closed: number; total: number };
};

function buildMarkdown(o: {
  generatedAt: string;
  dateStr: string;
  source: 'sheet' | 'static-fallback';
  metrics: ReportMetrics;
  kpiRows: { id: string; name: string; target: string; value: string; state: string }[];
  milestoneRows: { id: string; title: string; closed: boolean }[];
  surfaces: { name: string; url: string; host: string; announce: string; residue: string }[];
  recentAudit: Array<{ timestamp?: string; target?: string; verdict?: string }>;
}): string {
  const m = o.metrics;
  const L: string[] = [];
  L.push(`# ACUTERIUM MASTER OPERATIONS STATUS REPORT — ${o.dateStr}`);
  L.push('');
  L.push(`**Classification:** ACUTERIUM-INTERNAL // SOVEREIGN`);
  L.push(`**Generated:** ${o.generatedAt}`);
  L.push(`**Data source:** ${o.source === 'sheet' ? 'Live Google Sheet (service account)' : 'Static seed (Sheet unavailable — confidence downgraded)'}`);
  L.push('');
  L.push('## Reconciled Metrics');
  L.push('');
  L.push('| Metric | Value | Coverage |');
  L.push('|---|---|---|');
  L.push(`| Tasks complete | ${m.tasks.done}/${m.tasks.total} | ${pct(m.tasks.done, m.tasks.total)} |`);
  L.push(`| Milestones closed | ${m.milestones.closed}/${m.milestones.total} | ${pct(m.milestones.closed, m.milestones.total)} |`);
  L.push(`| Matrix coverage | ${m.matrix.rows}/${m.matrix.target} | ${pct(m.matrix.rows, m.matrix.target)} |`);
  L.push(`| KPIs achieved | ${m.kpis.achieved}/${m.kpis.total} | ${pct(m.kpis.achieved, m.kpis.total)} |`);
  L.push(`| Owner decisions closed | ${m.decisions.closed}/${m.decisions.total} | ${pct(m.decisions.closed, m.decisions.total)} |`);
  L.push('');
  L.push('## KPI Validation');
  L.push('');
  L.push('| KPI | Name | Target | Value | State |');
  L.push('|---|---|---|---|---|');
  for (const k of o.kpiRows) L.push(`| ${k.id} | ${k.name} | ${k.target} | ${k.value} | ${k.state} |`);
  L.push('');
  L.push('## Milestones');
  L.push('');
  for (const ms of o.milestoneRows) L.push(`- ${ms.closed ? '✅' : '⬜'} **${ms.id}** — ${ms.title}`);
  L.push('');
  L.push('## Live Surfaces');
  L.push('');
  L.push('| Surface | URL | Host | Announce | Residue |');
  L.push('|---|---|---|---|---|');
  for (const s of o.surfaces) L.push(`| ${s.name} | ${s.url} | ${s.host} | ${s.announce} | ${s.residue} |`);
  L.push('');
  L.push('## Changelog · Recent Activity');
  L.push('');
  if (o.recentAudit.length) {
    for (const a of o.recentAudit) L.push(`- ${a.timestamp ?? ''} · ${a.target ?? ''} · ${a.verdict ?? ''}`);
  } else {
    L.push('- No audited changes recorded yet in this window.');
  }
  L.push('');
  L.push('### Engineering log');
  for (const e of ENGINEERING_LOG.slice(-8)) L.push(`- [${e.status}] ${e.phase} \`${e.commit}\` — ${e.title} (${e.date})`);
  L.push('');
  L.push('---');
  L.push('*Generated live from the Master Ops backing store. Acuterium Technologies Inc. — Genesis Through Intelligence.*');
  return L.join('\n');
}
