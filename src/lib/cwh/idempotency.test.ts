/**
 * Unit tests · idempotency cache (Spec 3a.04).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetIdempotencyForTests,
  checkIdempotency,
  idempotencyStats,
  storeIdempotency,
} from './idempotency';
import type { TransitionResponse } from './types';

function mockResponse(over: Partial<TransitionResponse> = {}): TransitionResponse {
  return {
    verdict: 'allow',
    ruleId: 'CWH-R-04',
    doctrineDelta: 0.3,
    auditId: 'alog_01TESTAAAAAAAAAAAAAAAAAAAA',
    timestamp: '2026-05-21T10:00:00.000Z',
    reason: 'legal task transition',
    ...over,
  };
}

describe('idempotency cache', () => {
  beforeEach(() => {
    __resetIdempotencyForTests();
  });

  afterEach(() => {
    __resetIdempotencyForTests();
    vi.useRealTimers();
  });

  it('miss · empty cache', () => {
    expect(checkIdempotency('key1', 'task', 'T-001')).toEqual({ match: 'miss' });
  });

  it('hit · same key + same target + same targetId → returns cached', () => {
    const resp = mockResponse();
    storeIdempotency('key1', 'task', 'T-001', resp);
    const out = checkIdempotency('key1', 'task', 'T-001');
    expect(out.match).toBe('hit');
    if (out.match === 'hit') {
      expect(out.cached.auditId).toBe('alog_01TESTAAAAAAAAAAAAAAAAAAAA');
    }
  });

  it('collision · same key + DIFFERENT target → 409', () => {
    storeIdempotency('key1', 'task', 'T-001', mockResponse());
    expect(checkIdempotency('key1', 'milestone', 'T-001')).toEqual({ match: 'collision' });
  });

  it('collision · same key + DIFFERENT targetId → 409', () => {
    storeIdempotency('key1', 'task', 'T-001', mockResponse());
    expect(checkIdempotency('key1', 'task', 'T-002')).toEqual({ match: 'collision' });
  });

  it('different keys → both miss and store independently', () => {
    storeIdempotency('keyA', 'task', 'T-001', mockResponse({ auditId: 'alog_01AAAAAAAAAAAAAAAAAAAAAAAA' }));
    storeIdempotency('keyB', 'task', 'T-001', mockResponse({ auditId: 'alog_01BBBBBBBBBBBBBBBBBBBBBBBB' }));
    const hitA = checkIdempotency('keyA', 'task', 'T-001');
    const hitB = checkIdempotency('keyB', 'task', 'T-001');
    expect(hitA.match).toBe('hit');
    expect(hitB.match).toBe('hit');
    if (hitA.match === 'hit' && hitB.match === 'hit') {
      expect(hitA.cached.auditId).not.toBe(hitB.cached.auditId);
    }
  });

  it('LRU eviction at the 1001st entry (oldest evicted)', () => {
    for (let i = 0; i < 1000; i++) {
      storeIdempotency(`key_${i}`, 'task', `T-${i}`, mockResponse());
    }
    expect(idempotencyStats().size).toBe(1000);

    storeIdempotency('key_1001', 'task', 'T-1001', mockResponse());
    expect(idempotencyStats().size).toBe(1000);
    // Oldest (key_0) evicted
    expect(checkIdempotency('key_0', 'task', 'T-0')).toEqual({ match: 'miss' });
    // Newest present
    expect(checkIdempotency('key_1001', 'task', 'T-1001').match).toBe('hit');
  });

  it('TTL is configured at 1 hour (lru-cache enforces the expiry)', () => {
    // lru-cache uses performance.now() internally for TTL accounting,
    // which is not mocked by vi.useFakeTimers(). We trust lru-cache's
    // own TTL test suite for the expiry behavior; here we only verify
    // the cache was configured with the 1-hour TTL per spec 3a.04.
    expect(idempotencyStats().ttlMs).toBe(60 * 60 * 1000);
  });

  it('stats · reports size + max + ttl', () => {
    storeIdempotency('k1', 'task', 'T-1', mockResponse());
    storeIdempotency('k2', 'task', 'T-2', mockResponse());
    const s = idempotencyStats();
    expect(s.size).toBe(2);
    expect(s.max).toBe(1000);
    expect(s.ttlMs).toBe(60 * 60 * 1000);
  });
});
