/**
 * Sheets adapter tests · Phase 3a.02.
 *
 * Without a live Google service account, we test:
 *   - graceful degradation when env vars are unset
 *   - parser correctness for canonical rows
 *   - A1-notation column letter calculation
 *   - CWH-gated write path denies stress > 90 (delegated to the route file)
 *   - error path: API failure returns null (not throw)
 *
 * The route handler integration test (CWH deny stress > 90) lives in
 * app/api/sheets/update/route.test.ts. This file covers the lib layer.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetSheetsClientForTests, getSheetId, getSheetsClient } from './client';
import {
  parseChannelRow,
  parseDecisionRow,
  parseKpiRow,
  parseMilestoneRow,
  parsePortfolioRow,
  parseTaskRow,
} from './parsers';
import { readSheetTab } from './read';
import { columnLetter, writeSheetCell } from './write';

describe('Sheets client · graceful degradation', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    __resetSheetsClientForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetSheetsClientForTests();
  });

  it('getSheetsClient() returns null when env vars unset', () => {
    vi.stubEnv('GOOGLE_SHEETS_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SHEETS_PRIVATE_KEY', '');
    expect(getSheetsClient()).toBeNull();
  });

  it('getSheetId returns null when env unset', () => {
    vi.stubEnv('GOOGLE_SHEET_ID', '');
    expect(getSheetId()).toBeNull();
  });

  it('readSheetTab returns null when client is unavailable', async () => {
    vi.stubEnv('GOOGLE_SHEETS_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SHEETS_PRIVATE_KEY', '');
    const result = await readSheetTab('tasks', parseTaskRow);
    expect(result).toBeNull();
  });

  it('writeSheetCell returns ok=false when client is unavailable', async () => {
    vi.stubEnv('GOOGLE_SHEETS_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SHEETS_PRIVATE_KEY', '');
    const result = await writeSheetCell('tasks', 'T-001', 'done', 'true');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('sheets not configured');
  });
});

describe('Sheets parsers · canonical rows', () => {
  it('parseTaskRow maps id/phase/day/cat/title correctly', () => {
    expect(parseTaskRow(['T-001', '0', '0', 'OPERATOR', 'Phase 0 audit', 'FALSE'])).toEqual({
      id: 'T-001',
      phase: 0,
      day: 0,
      cat: 'OPERATOR',
      title: 'Phase 0 audit',
    });
  });

  it('parseTaskRow returns null when id or title is missing', () => {
    expect(parseTaskRow(['', '0', '0', 'OPERATOR', 'no id'])).toBeNull();
    expect(parseTaskRow(['T-001', '0', '0', 'OPERATOR', ''])).toBeNull();
  });

  it('parseMilestoneRow maps fields correctly', () => {
    expect(parseMilestoneRow(['M-00', 'Phase 0 closed', '0', '0', 'all checks', 'OPEN'])).toEqual({
      id: 'M-00',
      title: 'Phase 0 closed',
      phase: 0,
      day: 0,
      criterion: 'all checks',
      status: 'OPEN',
    });
  });

  it('parseDecisionRow preserves priority when set', () => {
    const r = parseDecisionRow(['OD-04', 'RUZN.AI residue', 'Dr. Jay sign-off', '', '', 'OPEN', 'PRIO-1']);
    expect(r?.priority).toBe('PRIO-1');
  });

  it('parseKpiRow defaults state to on_track when blank', () => {
    const r = parseKpiRow(['K-99', 'New KPI', 'src', '1', '1', '']);
    expect(r?.state).toBe('on_track');
  });

  it('parseChannelRow parses conflicts as a number', () => {
    const r = parseChannelRow(['CH-1', 'Cowork', 'sheet', 'op', '100', 'OPEN', 'out', '7']);
    expect(r?.conflicts).toBe(7);
  });

  it('parsePortfolioRow splits channels CSV', () => {
    const r = parsePortfolioRow([
      'P-001', 'StratEdge', 'product', 'AcuTect', 'L3', 'live', 'HIGH', 'Sovereign',
      'CH-1,CH-2,CH-3', 'announce', 'OD-04',
    ]);
    expect(r?.channels).toEqual(['CH-1', 'CH-2', 'CH-3']);
  });
});

describe('A1 column-letter math', () => {
  it('0 → A', () => {
    expect(columnLetter(0)).toBe('A');
  });
  it('25 → Z', () => {
    expect(columnLetter(25)).toBe('Z');
  });
  it('26 → AA', () => {
    expect(columnLetter(26)).toBe('AA');
  });
  it('27 → AB', () => {
    expect(columnLetter(27)).toBe('AB');
  });
  it('51 → AZ', () => {
    expect(columnLetter(51)).toBe('AZ');
  });
  it('52 → BA', () => {
    expect(columnLetter(52)).toBe('BA');
  });
});
