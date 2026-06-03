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
  // Accept BOTH naming conventions. The write client historically required
  // GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY, but the read
  // adapter (lib/sheets.ts), .env.example, and the DEPLOYMENT-GUIDE env table
  // document GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY. When an
  // operator set Vercel from the env table, this client silently returned null
  // and every Sheets write fell back to no-op ("last save: never"). Falling
  // back across both names unifies the two adapters and removes that footgun.
  const email =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey =
    process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    return null;
  }

  // Re-init if env changed at runtime (rare; helpful for tests).
  const k = email + ':' + privateKey.length;
  if (cachedClient && cacheKey === k) return cachedClient;

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
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
