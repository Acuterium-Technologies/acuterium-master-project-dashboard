/**
 * CWH idempotency cache · Phase 3a.04.
 *
 * Optional client-supplied idempotency keys on /api/cwh/transition. A
 * network retry that resends the same `idempotencyKey` against the same
 * (target, targetId) tuple returns the cached response verbatim — no
 * second audit row, no second doctrine-delta. A different (target,
 * targetId) under the same key returns 409 collision.
 *
 * Storage: in-memory LRU, 1000 entries, 1-hour TTL. Per-instance only;
 * Phase 4+ may promote to Upstash KV if multi-instance retry windows
 * become load-bearing.
 *
 * Doctrinal red-lines from spec 3a.04:
 *   - Key MUST match /^[a-zA-Z0-9_-]{8,64}$/ (Zod validates upstream)
 *   - Key NEVER appears in error response bodies or logs
 *   - 1000-entry cap + 1h TTL hard-coded (no env overrides without operator approval)
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { LRUCache } from 'lru-cache';
import type { TransitionResponse } from './types';

type IdempotencyRecord = {
  key: string;
  target: string;
  targetId: string;
  response: TransitionResponse;
  cachedAt: number;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

const cache = new LRUCache<string, IdempotencyRecord>({
  max: 1000,
  ttl: ONE_HOUR_MS,
});

export type IdempotencyCheck =
  | { match: 'miss' }
  | { match: 'hit'; cached: TransitionResponse }
  | { match: 'collision' };

export function checkIdempotency(
  key: string,
  target: string,
  targetId: string,
): IdempotencyCheck {
  const record = cache.get(key);
  if (!record) return { match: 'miss' };
  if (record.target === target && record.targetId === targetId) {
    return { match: 'hit', cached: record.response };
  }
  return { match: 'collision' };
}

export function storeIdempotency(
  key: string,
  target: string,
  targetId: string,
  response: TransitionResponse,
): void {
  cache.set(key, { key, target, targetId, response, cachedAt: Date.now() });
}

/** Dev-only stats endpoint feeds off this. */
export function idempotencyStats() {
  return {
    size: cache.size,
    max: cache.max,
    ttlMs: ONE_HOUR_MS,
  };
}

/** Test helper · resets cache between vitest cases. NOT for production use. */
export function __resetIdempotencyForTests(): void {
  cache.clear();
}
