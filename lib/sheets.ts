import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { MatrixRow, Task, Milestone, Kpi } from './seed';
import { SEED_MATRIX, SEED_TASKS, SEED_MILESTONES, SEED_KPIS } from './seed';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getClient(): sheets_v4.Sheets {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
  }
  const auth = new JWT({ email, key, scopes: SCOPES });
  return google.sheets({ version: 'v4', auth });
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('Missing GOOGLE_SHEET_ID env var');
  return id;
}

// ─── Read operations ───────────────────────────────────────────────────

export async function readMatrix(): Promise<MatrixRow[]> {
  try {
    const sheets = getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: 'Matrix!A2:J'
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return SEED_MATRIX;
    return rows.map(r => ({
      id: r[0] || '',
      name: r[1] || '',
      product: r[2] || '',
      layer: r[3] || '',
      status: r[4] || '',
      confidence: (r[5] as MatrixRow['confidence']) || 'MEDIUM',
      sensitivity: (r[6] as MatrixRow['sensitivity']) || 'Internal',
      action: r[7] || '',
      ownerDecision: r[8] || 'No',
      channels: r[9] || ''
    }));
  } catch (e) {
    console.error('readMatrix error:', e);
    return SEED_MATRIX;
  }
}

export async function readTasks(): Promise<Task[]> {
  try {
    const sheets = getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: 'Tasks!A2:F'
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return SEED_TASKS;
    return rows.map(r => ({
      id: r[0] || '',
      phase: Number(r[1]) as Task['phase'],
      day: Number(r[2]),
      cat: (r[3] as Task['cat']) || 'OPERATOR',
      title: r[4] || '',
      done: String(r[5]).toUpperCase() === 'TRUE'
    }));
  } catch (e) {
    console.error('readTasks error:', e);
    return SEED_TASKS;
  }
}

export async function readMilestones(): Promise<Milestone[]> {
  try {
    const sheets = getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: 'Milestones!A2:E'
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return SEED_MILESTONES;
    return rows.map(r => ({
      id: r[0] || '',
      day: Number(r[1]),
      title: r[2] || '',
      criterion: r[3] || '',
      closed: String(r[4]).toUpperCase() === 'TRUE'
    }));
  } catch (e) {
    console.error('readMilestones error:', e);
    return SEED_MILESTONES;
  }
}

export async function readKpis(): Promise<Kpi[]> {
  try {
    const sheets = getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: 'KPIs!A2:F'
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return SEED_KPIS;
    return rows.map(r => ({
      id: r[0] || '',
      phase: Number(r[1]) as Kpi['phase'],
      name: r[2] || '',
      target: r[3] || '',
      value: r[4] || '',
      source: r[5] || ''
    }));
  } catch (e) {
    console.error('readKpis error:', e);
    return SEED_KPIS;
  }
}

// ─── Write operations ──────────────────────────────────────────────────

export async function updateTaskDone(taskId: string, done: boolean): Promise<void> {
  const sheets = getClient();
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) throw new Error(`Task ${taskId} not found`);
  const row = idx + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `Tasks!F${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[done ? 'TRUE' : 'FALSE']] }
  });
}

export async function updateMilestoneClosed(milestoneId: string, closed: boolean): Promise<void> {
  const sheets = getClient();
  const milestones = await readMilestones();
  const idx = milestones.findIndex(m => m.id === milestoneId);
  if (idx === -1) throw new Error(`Milestone ${milestoneId} not found`);
  const row = idx + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `Milestones!E${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[closed ? 'TRUE' : 'FALSE']] }
  });
}

export async function updateKpiValue(kpiId: string, value: string): Promise<void> {
  const sheets = getClient();
  const kpis = await readKpis();
  const idx = kpis.findIndex(k => k.id === kpiId);
  if (idx === -1) throw new Error(`KPI ${kpiId} not found`);
  const row = idx + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `KPIs!E${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] }
  });
}

export async function appendAuditLog(actor: string, action: string, target: string, before: string, after: string): Promise<void> {
  try {
    const sheets = getClient();
    const ts = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSheetId(),
      range: 'AuditLog!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[ts, actor, action, target, before, after]] }
    });
  } catch (e) {
    console.error('appendAuditLog error:', e);
  }
}

// ─── Bulk seeding (one-time setup) ─────────────────────────────────────

export async function seedSheet(): Promise<{ matrix: number; tasks: number; milestones: number; kpis: number }> {
  const sheets = getClient();
  const id = getSheetId();

  const matrixRows = SEED_MATRIX.map(r => [r.id, r.name, r.product, r.layer, r.status, r.confidence, r.sensitivity, r.action, r.ownerDecision, r.channels || '']);
  const taskRows = SEED_TASKS.map(t => [t.id, t.phase, t.day, t.cat, t.title, t.done ? 'TRUE' : 'FALSE']);
  const milestoneRows = SEED_MILESTONES.map(m => [m.id, m.day, m.title, m.criterion, m.closed ? 'TRUE' : 'FALSE']);
  const kpiRows = SEED_KPIS.map(k => [k.id, k.phase, k.name, k.target, k.value, k.source]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Matrix!A1:J1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['id', 'name', 'product', 'layer', 'status', 'confidence', 'sensitivity', 'action', 'ownerDecision', 'channels']] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `Matrix!A2:J${matrixRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: matrixRows }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Tasks!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['id', 'phase', 'day', 'cat', 'title', 'done']] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `Tasks!A2:F${taskRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: taskRows }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Milestones!A1:E1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['id', 'day', 'title', 'criterion', 'closed']] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `Milestones!A2:E${milestoneRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: milestoneRows }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'KPIs!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['id', 'phase', 'name', 'target', 'value', 'source']] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `KPIs!A2:F${kpiRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: kpiRows }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'AuditLog!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['timestamp', 'actor', 'action', 'target', 'before', 'after']] }
  });

  return { matrix: SEED_MATRIX.length, tasks: SEED_TASKS.length, milestones: SEED_MILESTONES.length, kpis: SEED_KPIS.length };
}
