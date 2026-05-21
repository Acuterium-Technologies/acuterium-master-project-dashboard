/**
 * Google Sheets API client · Phase 3a.02.
 *
 * Lazily constructs a JWT-authenticated Sheets client from three env vars:
 *   GOOGLE_SHEET_ID
 *   GOOGLE_SHEETS_CLIENT_EMAIL
 *   GOOGLE_SHEETS_PRIVATE_KEY  (PEM with \n literals; we unescape at runtime)
 *
 * Returns `null` when any var is missing — callers fall back to static
 * src/data/*.ts (graceful degradation per Spec 3a.02).
 *
 * The service account private key MUST never appear in build output,
 * browser bundles, or any AuditLog entry. This module is server-only
 * (callers route through API handlers, never imported by client code).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import 'server-only';
import { google, type sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | null = null;
let cacheKey = '';

export function getSheetsClient(): sheets_v4.Sheets | null {
  const { GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY } = process.env;
  if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY) {
    return null;
  }

  // Re-init if env changed at runtime (rare; helpful for tests).
  const k = GOOGLE_SHEETS_CLIENT_EMAIL + ':' + GOOGLE_SHEETS_PRIVATE_KEY.length;
  if (cachedClient && cacheKey === k) return cachedClient;

  const auth = new google.auth.JWT({
    email: GOOGLE_SHEETS_CLIENT_EMAIL,
    key: GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  cacheKey = k;
  return cachedClient;
}

export function getSheetId(): string | null {
  return process.env.GOOGLE_SHEET_ID || null;
}

/** Test helper · clears the cached client between vitest cases. */
export function __resetSheetsClientForTests(): void {
  cachedClient = null;
  cacheKey = '';
}
