# Spec 3a.04 · Idempotency Keys for `/api/cwh/transition`

**Sub-phase:** 3a
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved for implementation
**Estimated time:** 30 min

---

## Why

Phase 2 pause-point report (eND-Phase-2-REPORT.MD) raised open question #5:

> Should the route accept an optional `idempotencyKey` so a network-retry doesn't double-append the audit?

Answer: yes. Network retries are common (mobile networks, browser back/forward, double-tap on CWH-gated togglers). Without idempotency, a single user action can produce N audit entries and N doctrine-delta applications.

## Out of scope

- Idempotency for `/api/sheets/update` (Phase 3b — different write semantics)
- Server-driven idempotency (e.g. content-hash) — explicit client-supplied keys only

## Contract

### Request — adds optional field

```typescript
const TransitionRequestSchema = z.object({
  target: z.enum(['task', 'milestone', 'od', 'residue']),
  targetId: z.string(),
  fromState: z.string(),
  toState: z.string(),
  actor: ActorSchema,
  context: ContextSchema,
  idempotencyKey: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/).optional(),  // NEW
});
```

### Behavior

1. **Without `idempotencyKey`** → existing behavior (every POST creates a new audit row)
2. **With `idempotencyKey`** → server checks the in-memory dedup cache (LRU 1000 entries):
   - **Cache hit (same key + same target + same targetId)** → return the cached response verbatim, do NOT create a new audit row
   - **Cache hit (same key but different target OR targetId)** → return `409 CONFLICT` with `error: 'idempotency key collision'`
   - **Cache miss** → process normally, cache the response under the key, return

### Cache structure

```typescript
// src/lib/cwh/idempotency.ts
import { LRUCache } from 'lru-cache';

interface IdempotencyRecord {
  key: string;
  target: string;
  targetId: string;
  response: TransitionResponse;
  cachedAt: number;
}

const cache = new LRUCache<string, IdempotencyRecord>({
  max: 1000,
  ttl: 60 * 60 * 1000,  // 1 hour TTL — long enough for retries, short enough to bound memory
});

export function checkIdempotency(
  key: string,
  target: string,
  targetId: string
): { match: 'hit' | 'collision' | 'miss'; cached?: TransitionResponse } {
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
  response: TransitionResponse
): void {
  cache.set(key, { key, target, targetId, response, cachedAt: Date.now() });
}
```

### Route changes

```typescript
// In app/api/cwh/transition/route.ts, after schema validation:

if (parsed.data.idempotencyKey) {
  const check = checkIdempotency(
    parsed.data.idempotencyKey,
    parsed.data.target,
    parsed.data.targetId
  );
  if (check.match === 'hit') {
    // Return cached response verbatim (same auditId, same verdict, no new write)
    return NextResponse.json(check.cached!, { status: 200 });
  }
  if (check.match === 'collision') {
    return NextResponse.json({
      error: 'idempotency key collision',
      code: 'IDEMPOTENCY_COLLISION',
      requestId: `req_${randomId()}`,
    }, { status: 409 });
  }
}

// ... existing evaluator + audit append ...

if (parsed.data.idempotencyKey) {
  storeIdempotency(parsed.data.idempotencyKey, parsed.data.target, parsed.data.targetId, responseBody);
}

return NextResponse.json(responseBody);
```

### Client hook update

`src/hooks/useCWHTransition.ts` — generate a ULID per logical user action, retry with the same key:

```typescript
import { ulid } from 'ulid';

export function useCWHTransition() {
  return useCallback(async (req: TransitionRequest) => {
    const idempotencyKey = ulid();
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await fetch('/api/cwh/transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...req, idempotencyKey }),
        });

        // 429 retry with same key
        if (response.status === 429 && attempt < maxAttempts) {
          const retryAfter = Number(response.headers.get('retry-after') ?? '1');
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }

        return await response.json();
      } catch (err) {
        if (attempt >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }, []);
}
```

## Doctrinal red-lines

- Idempotency key MUST match `[a-zA-Z0-9_-]{8,64}` (Zod enforces) — no slashes, no spaces, no PII
- Idempotency key MUST NEVER appear in any error response body (only in `auditId` mapping internally)
- Idempotency key MUST NEVER be logged with raw value — log a SHA-256 prefix only if logging at all
- Cache is **in-memory only** — does not persist across deploys (acceptable: retries within a 1h deploy window are caught, longer retries fall through to normal duplicate audit)
- 1000-entry LRU cap MUST be enforced (no unbounded growth)
- TTL 1 hour is the maximum — do not extend without operator approval

## Tests (Vitest)

`src/lib/cwh/idempotency.test.ts`:

1. Same key + same target + same targetId → returns cached response, no new audit row
2. Same key + DIFFERENT target → returns 409 collision
3. Same key + DIFFERENT targetId → returns 409 collision
4. Different keys → both process normally
5. Cache LRU eviction at 1001st entry (oldest evicted)
6. TTL expiry — entry removed after 1h
7. No idempotencyKey → existing behavior preserved (every POST = new audit)
8. Idempotency key validation — invalid chars → 400 with Zod error

## Acceptance criteria

- [ ] All 8 Vitest assertions pass
- [ ] Smoke test: 5 rapid POSTs with same `idempotencyKey` → 1 audit row, 5 identical responses
- [ ] Smoke test: 5 rapid POSTs with different `idempotencyKey` values → 5 audit rows, 5 different `auditId` values
- [ ] Smoke test: POST with key reused on different `targetId` → 409
- [ ] Idempotency key NEVER appears in any error response body
- [ ] Bundle delta < +5 kB (lru-cache is tiny)
- [ ] Cache stats endpoint at `/api/cwh/idempotency/stats` (dev-only) shows size/hit-rate
