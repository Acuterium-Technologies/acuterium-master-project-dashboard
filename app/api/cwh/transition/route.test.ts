/**
 * Integration tests · POST /api/cwh/transition.
 * Phase 2 · Preflight rule 7.9 (429 + Retry-After) · rule 7.15 (client/server parity).
 *
 * Each test constructs a NextRequest with a mocked cookie and the
 * DASHBOARD_ACCESS_TOKEN env var, then invokes the route handler
 * directly (no HTTP listener needed under vitest/node).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

import { cwhRateLimiter } from '../../../../src/lib/cwh/ratelimit';
import { evaluateCWH } from '../../../../src/lib/cwh/evaluate';
import type { TransitionRequest, TransitionResponse } from '../../../../src/lib/cwh/types';
import { POST } from './route';

const TOKEN = 'test-dashboard-token-phase-2';

function makeRequest(opts: {
  cookie?: string | null;
  body?: unknown;
  ip?: string;
}): NextRequest {
  const cookieJar = new Map<string, { value: string }>();
  if (opts.cookie !== null && opts.cookie !== undefined) {
    cookieJar.set('acuterium-access', { value: opts.cookie });
  }
  const headers = new Headers();
  if (opts.ip) headers.set('x-forwarded-for', opts.ip);

  // Minimal NextRequest shim. The route reads .cookies.get(), .headers.get(),
  // .ip, and .json() — all of which we provide.
  return {
    cookies: {
      get: (name: string) => cookieJar.get(name),
    },
    headers,
    ip: opts.ip ?? '127.0.0.1',
    json: async () => opts.body,
  } as unknown as NextRequest;
}

function payload(over: Partial<TransitionRequest> = {}): TransitionRequest {
  return {
    target: 'task',
    targetId: 'T-001',
    fromState: 'open',
    toState: 'done',
    actor: {
      session: 'sess_integ',
      pathos: { stress: 40, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
    },
    context: { kairosMode: 'AUI', doctrineScore: 75 },
    ...over,
  };
}

describe('POST /api/cwh/transition · integration', () => {
  beforeEach(() => {
    vi.stubEnv('DASHBOARD_ACCESS_TOKEN', TOKEN);
    cwhRateLimiter.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cwhRateLimiter.reset();
  });

  it('401 when access cookie is missing', async () => {
    const res = await POST(makeRequest({ cookie: null, body: payload() }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('UNAUTHENTICATED');
  });

  it('403 when access cookie is wrong', async () => {
    const res = await POST(makeRequest({ cookie: 'wrong-token', body: payload() }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
  });

  it('200 allow for each of 4 valid target values', async () => {
    const targets: TransitionRequest['target'][] = ['task', 'milestone', 'od', 'residue'];
    for (const t of targets) {
      const body =
        t === 'task'
          ? payload({ target: t, fromState: 'open', toState: 'done' })
          : t === 'milestone'
            ? payload({ target: t, fromState: 'open', toState: 'closed' })
            : t === 'od'
              ? payload({ target: t, fromState: 'open', toState: 'closed' })
              : payload({ target: t, fromState: 'NOT-RUN', toState: 'FLAGGED' });

      const res = await POST(
        makeRequest({ cookie: TOKEN, body, ip: '10.0.0.' + (targets.indexOf(t) + 1) }),
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as TransitionResponse;
      expect(json.verdict).toMatch(/allow|deny/);
      expect(json.auditId).toMatch(/^alog_[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('client/server verdict parity · server response equals evaluateCWH preview', async () => {
    const samples: TransitionRequest[] = [
      payload(),
      payload({ actor: { session: 's', pathos: { stress: 95, focus: 50, curiosity: 50, fatigue: 30, satisfaction: 55 } } }),
      payload({ target: 'od', actor: { session: 's', pathos: { stress: 40, focus: 60, curiosity: 50, fatigue: 90, satisfaction: 55 } }, fromState: 'open', toState: 'closed' }),
      payload({ target: 'residue', fromState: 'CLEAN', toState: 'FLAGGED' }),
      payload({ context: { kairosMode: 'AUI', doctrineScore: 30 } }),
    ];

    for (let i = 0; i < samples.length; i++) {
      const preview = evaluateCWH(samples[i]);
      const res = await POST(
        makeRequest({ cookie: TOKEN, body: samples[i], ip: '10.1.0.' + (i + 1) }),
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as TransitionResponse;
      expect(json.verdict).toBe(preview.verdict);
      expect(json.ruleId).toBe(preview.ruleId);
      expect(json.doctrineDelta).toBeCloseTo(preview.doctrineDelta);
    }
  });

  it('400 on schema violation · bad kairosMode', async () => {
    const bad = { ...payload(), context: { kairosMode: 'Quantum', doctrineScore: 75 } };
    const res = await POST(makeRequest({ cookie: TOKEN, body: bad }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_INPUT');
  });

  it('429 with Retry-After when over 10 req/sec/IP', async () => {
    const ip = '10.42.0.1';
    let last;
    for (let i = 0; i < 12; i++) {
      last = await POST(makeRequest({ cookie: TOKEN, body: payload(), ip }));
    }
    if (!last) throw new Error('no response captured');
    expect(last.status).toBe(429);
    expect(last.headers.get('Retry-After')).toBeTruthy();
    const body = await last.json();
    expect(body.code).toBe('RATE_LIMITED');
  });

  it('rate limit · separate IPs are tracked independently', async () => {
    // IP-A fills its bucket
    for (let i = 0; i < 10; i++) {
      const r = await POST(makeRequest({ cookie: TOKEN, body: payload(), ip: '10.99.0.1' }));
      expect(r.status).toBe(200);
    }
    // IP-B should still be allowed
    const rB = await POST(makeRequest({ cookie: TOKEN, body: payload(), ip: '10.99.0.2' }));
    expect(rB.status).toBe(200);
  });

  it('auditId is unique per call (ULID monotonicity)', async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeRequest({ cookie: TOKEN, body: payload(), ip: '10.55.0.' + (i + 1) }),
      );
      const json = (await res.json()) as TransitionResponse;
      ids.add(json.auditId);
    }
    expect(ids.size).toBe(5);
  });
});
