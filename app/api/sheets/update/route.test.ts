/**
 * Integration tests · POST /api/sheets/update (Phase 3a.02).
 *
 * - 401 when access cookie is missing
 * - 400 on schema violation (invalid kairosMode)
 * - CWH gate denies stress > 90 — audit row written, no sheets call
 * - Sheets write failure still produces a valid audit row
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

import { __resetSheetsClientForTests } from '../../../../src/lib/sheets/client';
import { POST } from './route';

const TOKEN = 'test-token-sheets-update';

function makeRequest(opts: {
  cookie?: string | null;
  body?: unknown;
}): NextRequest {
  const cookieJar = new Map<string, { value: string }>();
  if (opts.cookie != null) cookieJar.set('acuterium-access', { value: opts.cookie });
  return {
    cookies: { get: (n: string) => cookieJar.get(n) },
    headers: new Headers(),
    ip: '127.0.0.1',
    json: async () => opts.body,
    nextUrl: new URL('http://localhost/api/sheets/update'),
  } as unknown as NextRequest;
}

function body(over: Record<string, unknown> = {}) {
  return {
    target: 'task-update',
    targetId: 'T-001',
    field: 'done',
    newValue: 'true',
    actor: {
      session: 'sess_integ',
      pathos: { stress: 40, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
    },
    context: { kairosMode: 'AUI', doctrineScore: 75 },
    ...over,
  };
}

describe('POST /api/sheets/update', () => {
  beforeEach(() => {
    vi.stubEnv('DASHBOARD_ACCESS_TOKEN', TOKEN);
    __resetSheetsClientForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetSheetsClientForTests();
  });

  it('401 without cookie', async () => {
    const res = await POST(makeRequest({ cookie: null, body: body() }));
    expect(res.status).toBe(401);
  });

  it('400 on invalid kairosMode', async () => {
    const res = await POST(
      makeRequest({ cookie: TOKEN, body: body({ context: { kairosMode: 'Quantum', doctrineScore: 75 } }) }),
    );
    expect(res.status).toBe(400);
  });

  it('CWH deny when stress > 90 → audit row written, no sheets write attempted', async () => {
    // Sheets env unset so any write attempt would surface as 502, but we expect
    // the CWH deny to short-circuit before the write path is reached.
    vi.stubEnv('GOOGLE_SHEETS_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SHEETS_PRIVATE_KEY', '');

    const res = await POST(
      makeRequest({
        cookie: TOKEN,
        body: body({
          actor: {
            session: 'sess_integ',
            pathos: { stress: 95, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
          },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('deny');
    expect(json.ruleId).toBe('CWH-R-01');
    expect(json.auditId).toMatch(/^alog_/);
  });

  it('allow + sheets unset → 502 with auditId present', async () => {
    vi.stubEnv('GOOGLE_SHEETS_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SHEETS_PRIVATE_KEY', '');

    const res = await POST(makeRequest({ cookie: TOKEN, body: body() }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.verdict).toBe('allow');
    expect(json.auditId).toMatch(/^alog_/);
    expect(json.error).toContain('sheets write failed');
  });
});
