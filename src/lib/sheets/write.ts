/**
 * Sheets write adapter · Phase 3a.02.
 *
 * Single-cell update by (tab, id, field, newValue). Finds the row whose
 * `id` column matches and writes `newValue` into the column whose
 * header matches `field`. A1-notation column letters are computed
 * locally so we don't ship an extra dep.
 *
 * Returns `{ ok: false }` on every failure path (auth missing, column
 * not found, id not found, API error). Callers route this back to the
 * operator via CWH-gated API responses.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import 'server-only';
import { getSheetId, getSheetsClient } from './client';

const HEADER_CACHE: Record<string, string[]> = {};

export function columnLetter(index: number): string {
  let s = '';
  let i = index;
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}

async function getHeaderRow(tab: string): Promise<string[]> {
  if (HEADER_CACHE[tab]) return HEADER_CACHE[tab];
  const client = getSheetsClient();
  const sheetId = getSheetId();
  if (!client || !sheetId) return [];

  const response = await client.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A1:Z1`,
  });
  const headers = (response.data.values?.[0] ?? []) as string[];
  HEADER_CACHE[tab] = headers;
  return headers;
}

export type WriteResult = { ok: boolean; reason?: string };

export async function writeSheetCell(
  tab: string,
  id: string,
  field: string,
  newValue: string,
): Promise<WriteResult> {
  const client = getSheetsClient();
  const sheetId = getSheetId();
  if (!client || !sheetId) return { ok: false, reason: 'sheets not configured' };

  try {
    const headers = await getHeaderRow(tab);
    const idCol = headers.indexOf('id');
    const fieldCol = headers.indexOf(field);
    if (idCol === -1) return { ok: false, reason: 'id column not found in header' };
    if (fieldCol === -1) return { ok: false, reason: `field column '${field}' not found in header` };

    const idRange = `${tab}!${columnLetter(idCol)}:${columnLetter(idCol)}`;
    const idResponse = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: idRange,
    });
    const ids = (idResponse.data.values ?? []) as string[][];
    const rowIndex = ids.findIndex((r) => r[0] === id);
    if (rowIndex === -1) return { ok: false, reason: 'id not found in sheet' };

    // Sheets is 1-indexed: row 1 is the header, so rowIndex 1 → A2 etc.
    const cellRange = `${tab}!${columnLetter(fieldCol)}${rowIndex + 1}`;

    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newValue]] },
    });
    return { ok: true };
  } catch (err) {
    console.error('[sheets:write] failed', err);
    return { ok: false, reason: String(err) };
  }
}

/** Test helper · clears header cache between vitest cases. */
export function __resetSheetsWriteCache(): void {
  for (const k of Object.keys(HEADER_CACHE)) delete HEADER_CACHE[k];
}
