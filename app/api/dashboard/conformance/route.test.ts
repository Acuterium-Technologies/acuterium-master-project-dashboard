/**
 * Integration tests · GET /api/dashboard/conformance · Phase 3b.03.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

import { GET } from './route';

const TOKEN = 'test-token-conformance';

function makeRequest(opts: { cookie?: string | null } = {}): NextRequest {
  const cookieJar = new Map<string, { value: string }>();
  if (opts.cookie != null) cookieJar.set('acuterium-access', { value: opts.cookie });
  return {
    cookies: { get: (n: string) => cookieJar.get(n) },
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/dashboard/conformance'),
  } as unknown as NextRequest;
}

describe('GET /api/dashboard/conformance', () => {
  beforeEach(() => {
    vi.stubEnv('DASHBOARD_ACCESS_TOKEN', TOKEN);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('401 without cookie', async () => {
    const res = await GET(makeRequest({ cookie: null }));
    expect(res.status).toBe(401);
  });

  it('401 with wrong cookie', async () => {
    const res = await GET(makeRequest({ cookie: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('200 + source=unavailable + operationalScore=100 when POSTGRES_URL unset', async () => {
    vi.stubEnv('POSTGRES_URL', '');
    const res = await GET(makeRequest({ cookie: TOKEN }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe('unavailable');
    expect(json.operationalScore).toBe(100);
    expect(json.denyRate24h).toBe(0);
    expect(json.sampleSize).toBe(0);
  });

  it('200 + source=unavailable when running on edge runtime (no fs/pg)', async () => {
    vi.stubEnv('POSTGRES_URL', 'postgres://stub');
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const res = await GET(makeRequest({ cookie: TOKEN }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe('unavailable');
  });
});
