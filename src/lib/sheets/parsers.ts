/**
 * Sheets row parsers · Phase 3a.02.
 *
 * One parser per tab. Each maps a raw string[] row (Google Sheets
 * `values.get` returns this shape) to the typed domain object from
 * src/data/types.ts.
 *
 * Returns `null` when the row is incomplete; callers `.filter(Boolean)`.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type {
  Channel,
  Conflict,
  Decision,
  KPI,
  Milestone,
  PortfolioRow,
  SpineRow,
  Sprint,
  Surface,
  Task,
} from '../../data/types';

function bool(v: string | undefined): boolean {
  if (!v) return false;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function csv(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(',').map((x) => x.trim()).filter(Boolean);
}

export function parseTaskRow(row: string[]): Task | null {
  const [id, phase, day, cat, title] = row;
  if (!id || !title) return null;
  return {
    id,
    phase: num(phase),
    day: num(day),
    cat: (cat as Task['cat']) ?? 'OPERATOR',
    title,
  };
}

export function parseMilestoneRow(row: string[]): Milestone | null {
  const [id, title, phase, day, criterion, status] = row;
  if (!id || !title) return null;
  return {
    id,
    title,
    phase: num(phase),
    day: num(day),
    criterion: criterion || '',
    status: status || 'OPEN',
  };
}

export function parseDecisionRow(row: string[]): Decision | null {
  const [id, item, need, blocking, rec, status, priority] = row;
  if (!id || !item) return null;
  return {
    id,
    item,
    need: need || '',
    blocking: blocking || '',
    rec: rec || '',
    status: status || 'OPEN',
    priority: priority || undefined,
  };
}

export function parseKpiRow(row: string[]): KPI | null {
  const [id, name, source, target, value, state] = row;
  if (!id || !name) return null;
  const stateNorm = (state || 'on_track') as KPI['state'];
  return {
    id,
    name,
    source: source || '',
    target: target || '',
    value: value || '',
    state: stateNorm,
  };
}

export function parseChannelRow(row: string[]): Channel | null {
  const [id, name, surface, access, coverage, status, output, conflicts, note, residueVerdict] =
    row;
  if (!id || !name) return null;
  return {
    id,
    name,
    surface: surface || '',
    access: access || '',
    coverage: coverage || '',
    status: status || '',
    output: output || '',
    conflicts: num(conflicts),
    note: note || undefined,
    residueVerdict: residueVerdict || null,
  };
}

export function parsePortfolioRow(row: string[]): PortfolioRow | null {
  const [
    id,
    name,
    type,
    product,
    layer,
    status,
    confidence,
    sensitivity,
    channels,
    action,
    ownerDecision,
  ] = row;
  if (!id || !name) return null;
  return {
    id,
    name,
    type: type || '',
    product: product || '',
    layer: layer || '',
    status: status || '',
    confidence: (confidence as PortfolioRow['confidence']) || 'MEDIUM',
    sensitivity: (sensitivity as PortfolioRow['sensitivity']) || 'Internal',
    channels: csv(channels),
    action: action || '',
    ownerDecision: ownerDecision || '',
  };
}

export function parseSurfaceRow(row: string[]): Surface | null {
  const [name, url, host, announce, residue, action] = row;
  if (!name || !url) return null;
  return {
    name,
    url,
    host: host || '',
    announce: announce || '',
    residue: residue || '',
    action: action || '',
  };
}

export function parseConflictRow(row: string[]): Conflict | null {
  const [id, topic, srcA, srcB, desc, resolution, status] = row;
  if (!id || !topic) return null;
  return {
    id,
    topic,
    srcA: srcA || '',
    srcB: srcB || '',
    desc: desc || '',
    resolution: resolution || '',
    status: status || 'open',
  };
}

export function parseSpineRow(row: string[]): SpineRow | null {
  const [repo, layer, purpose, state, action, od] = row;
  if (!repo) return null;
  return {
    repo,
    layer: layer || '',
    purpose: purpose || '',
    state: state || '',
    action: action || '',
    od: od || '',
  };
}

export function parseSprintRow(row: string[]): Sprint | null {
  const [id, range, scope, status, tag, verify] = row;
  if (!id) return null;
  return {
    id,
    range: range || '',
    scope: scope || '',
    status: status || '',
    tag: tag || '',
    verify: verify || '',
  };
}

// Marker used by `parseTaskRow` Boolean column tests.
export const __testHelpers = { bool, num, csv };
