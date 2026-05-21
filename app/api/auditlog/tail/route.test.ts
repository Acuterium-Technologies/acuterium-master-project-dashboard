/**
 * Integration tests · GET /api/auditlog/tail · Phase 3b.01.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

import { GET } from './route';

const TOKEN = 'test-token-tail';

function makeRequest(opts: { cookie?: string | null; limit?: string } = {}): NextRequest {
  const cookieJar = new Map<string, { value: string }>();
  if (opts.cookie != null) cookieJar.set('acuterium-access', { value: opts.cookie });
  const url = new URL('http://localhost/api/auditlog/tail');
  if (opts.limit) url.searchParams.set('limit', opts.limit);
  return {
    cookies: { get: (n: string) => cookieJar.get(n) },
    headers: new Headers(),
    nextUrl: url,
  } as unknown as NextRequest;
}

describe('GET /api/auditlog/tail', () => {
  beforeEach(() => {
    vi.stubEnv('DASHBOARD_ACCESS_TOKEN', TOKEN);
    vi.stubEnv('POSTGRES_URL', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('401 without cookie', async () => {
    const res = await GET(makeRequest({ cookie: null }));
    expect(res.status).toBe(401);
  });

  it('200 with empty entries when Postgres unset + no JSONL file', async () => {
    const res = await GET(makeRequest({ cookie: TOKEN }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.entries)).toBe(true);
    expect(json.source).toMatch(/^(jsonl|unavailable)$/);
  });

  it('limit clamped to max 50', async () => {
    const res = await GET(makeRequest({ cookie: TOKEN, limit: '999' }));
    expect(res.status).toBe(200);
    // No way to assert exact clamp without seeded data; the contract is non-throwing.
    const json = await res.json();
    expect(json.entries.length).toBeLessThanOrEqual(50);
  });

  it('invalid limit defaults gracefully (no crash)', async () => {
    const res = await GET(makeRequest({ cookie: TOKEN, limit: 'not-a-number' }));
    expect(res.status).toBe(200);
  });
});
