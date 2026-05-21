/**
 * Sheets read adapter · Phase 3a.02.
 *
 * Generic `readSheetTab` reads the named tab's A:Z range, drops the
 * header row, maps each remaining row through the supplied parser,
 * filters nulls, and returns the typed array. Returns `null` (not
 * throw) when the Sheets client is unavailable or the API call fails —
 * route handlers translate `null` into a 503 + `fallback: true`.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import 'server-only';
import { getSheetId, getSheetsClient } from './client';

export async function readSheetTab<T>(
  tabName: string,
  headerMap: (row: string[]) => T | null,
): Promise<T[] | null> {
  const client = getSheetsClient();
  const sheetId = getSheetId();
  if (!client || !sheetId) return null;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A:Z`,
    });
    const rows = (response.data.values ?? []) as string[][];
    if (rows.length < 2) return [];
    return rows
      .slice(1)
      .map(headerMap)
      .filter((x): x is T => x !== null);
  } catch (err) {
    console.error(`[sheets:read] ${tabName} failed`, err);
    return null;
  }
}
