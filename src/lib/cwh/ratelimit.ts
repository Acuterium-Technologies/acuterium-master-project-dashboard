/**
 * In-memory rate limiter · 10 req/sec/IP.
 * Phase 2 · sole guard against accidental client floods on /api/cwh/transition.
 *
 * Implementation: sliding 1-second window of timestamps per IP, capped in
 * an LRU-style Map (oldest IPs evicted when capacity exceeded). Each call
 * to consume(ip) appends `now` to that IP's deque, prunes entries older
 * than `windowMs`, and returns the verdict plus the time until the next
 * available slot if the IP is over the limit.
 *
 * Limitations (acknowledged in PR description per Phase 2 dispatch):
 *   - Vercel serverless: each function instance has its own memory, so
 *     under burst traffic distributed across multiple instances the
 *     effective limit is N × 10 req/sec where N = concurrent instances.
 *   - This is acceptable for Phase 2 because the dashboard's only client
 *     is a logged-in operator; Phase 3+ may swap this for Upstash KV or
 *     similar if RBAC widens access.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export type RateLimitVerdict = {
  ok: boolean;
  /** Milliseconds the caller should wait before retrying. 0 when ok=true. */
  retryAfterMs: number;
  /** Remaining requests in the current window after this consume. */
  remaining: number;
};

export type RateLimiter = {
  consume: (key: string, now?: number) => RateLimitVerdict;
  reset: () => void;
};

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 1000;
const DEFAULT_MAX_KEYS = 1024;

export function createRateLimiter(
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxKeys: number = DEFAULT_MAX_KEYS,
): RateLimiter {
  // Insertion-ordered Map → LRU eviction by deleting the first key.
  const store = new Map<string, number[]>();

  return {
    consume(key, now = Date.now()) {
      let timestamps = store.get(key);
      if (timestamps) {
        // Refresh LRU position.
        store.delete(key);
      } else {
        timestamps = [];
        if (store.size >= maxKeys) {
          const oldest = store.keys().next().value;
          if (oldest !== undefined) store.delete(oldest);
        }
      }

      // Prune entries older than the window.
      const cutoff = now - windowMs;
      while (timestamps.length > 0 && timestamps[0] <= cutoff) {
        timestamps.shift();
      }

      if (timestamps.length >= limit) {
        const retryAfterMs = timestamps[0] + windowMs - now;
        store.set(key, timestamps);
        return { ok: false, retryAfterMs: Math.max(retryAfterMs, 1), remaining: 0 };
      }

      timestamps.push(now);
      store.set(key, timestamps);
      return { ok: true, retryAfterMs: 0, remaining: limit - timestamps.length };
    },

    reset() {
      store.clear();
    },
  };
}

// Single shared limiter for the /api/cwh/transition route.
export const cwhRateLimiter: RateLimiter = createRateLimiter();
