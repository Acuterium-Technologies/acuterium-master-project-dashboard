/**
 * POST /api/cwh/transition · server-side CWH gate.
 * Phase 2 · ACU-DISPATCH-SCHEMA v1.1.
 *
 * Pipeline (in order):
 *   1. Bearer-cookie auth: cookie `acuterium-access` must equal
 *      process.env.DASHBOARD_ACCESS_TOKEN. Leak-fix middleware at 58b61d1
 *      already enforces this for the surface; we re-check inside the
 *      route so a future matcher carve-out cannot accidentally expose it.
 *   2. Rate limit: 10 req/sec/IP via in-memory LRU. 429 + Retry-After.
 *   3. Zod validation: TransitionRequestSchema (preflight rules 7.4–7.6).
 *   4. evaluateCWH(input): pure 12-rule evaluator from src/lib/cwh.
 *   5. AuditLog: ULID-keyed JSONL append (audit-log.ts).
 *   6. Telemetry: console.info JSON line for dev + Vercel runtime logs.
 *
 * Runtime: NODE (not edge) — auditlog requires fs. The brief mentions
 * "edge-compatible" as a routing convention (Next.js App Router) rather
 * than strictly Edge Runtime; Phase 3's migration to Vercel Blob +
 * Postgres mirror will reopen edge as an option.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  appendAuditEntry,
  appendAuditPostgres,
  newAuditId,
  type AuditEntry,
} from '../../../../src/lib/cwh/auditlog';
import { evaluateCWH } from '../../../../src/lib/cwh/evaluate';
import {
  checkIdempotency,
  storeIdempotency,
} from '../../../../src/lib/cwh/idempotency';
import { cwhRateLimiter } from '../../../../src/lib/cwh/ratelimit';
import {
  TransitionRequestSchema,
  type ErrorResponse,
  type TransitionResponse,
} from '../../../../src/lib/cwh/types';

export const runtime = 'nodejs';

const COOKIE_NAME = 'acuterium-access';

function newRequestId(): string {
  return 'req_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return req.ip ?? 'unknown';
}

function errorResponse(
  status: number,
  body: ErrorResponse,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = newRequestId();

  // ── 1. Auth ────────────────────────────────────────────────────────
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  if (!expected) {
    // Fail-closed: never silently allow when the gate is misconfigured.
    return errorResponse(503, {
      error: 'DASHBOARD_ACCESS_TOKEN not configured · fail-closed',
      code: 'SERVER_ERROR',
      requestId,
    });
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    return errorResponse(401, {
      error: 'missing access cookie',
      code: 'UNAUTHENTICATED',
      requestId,
    });
  }
  if (cookie !== expected) {
    return errorResponse(403, {
      error: 'invalid access token',
      code: 'FORBIDDEN',
      requestId,
    });
  }

  // ── 2. Rate limit ──────────────────────────────────────────────────
  const ip = clientIp(req);
  const rl = cwhRateLimiter.consume(ip);
  if (!rl.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
    return errorResponse(
      429,
      {
        error: 'rate limit exceeded · 10 req/sec/IP',
        code: 'RATE_LIMITED',
        requestId,
      },
      { 'Retry-After': String(retryAfterSec) },
    );
  }

  // ── 3. Validate ────────────────────────────────────────────────────
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse(400, {
      error: 'invalid JSON body',
      code: 'INVALID_INPUT',
      requestId,
    });
  }

  const parsed = TransitionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(400, {
      error: 'schema validation failed: ' + parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join(' · '),
      code: 'INVALID_INPUT',
      requestId,
    });
  }

  // ── 3a. Idempotency check (Phase 3a · spec 04) ─────────────────────
  // Cache hit (same key + same tuple) → return verbatim, no new audit row.
  // Cache hit (same key + different tuple) → 409 collision.
  // Cache miss → proceed and cache the response below.
  const idemKey = parsed.data.idempotencyKey;
  if (idemKey) {
    const check = checkIdempotency(idemKey, parsed.data.target, parsed.data.targetId);
    if (check.match === 'hit') {
      return NextResponse.json(check.cached, {
        status: 200,
        headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId, 'X-Idempotency-Replay': '1' },
      });
    }
    if (check.match === 'collision') {
      // NEVER leak the key itself in the response body — only the code.
      return errorResponse(409, {
        error: 'idempotency key collision · same key used for a different (target, targetId) tuple',
        code: 'IDEMPOTENCY_COLLISION',
        requestId,
      });
    }
  }

  // ── 4. Evaluate ────────────────────────────────────────────────────
  const result = evaluateCWH(parsed.data);

  // ── 5. Audit ───────────────────────────────────────────────────────
  const auditId = newAuditId();
  const timestamp = new Date().toISOString();
  const entry: AuditEntry = {
    auditId,
    timestamp,
    request: parsed.data,
    verdict: result.verdict,
    ruleId: result.ruleId,
    doctrineDelta: result.doctrineDelta,
    reason: result.reason,
  };

  // Belt-and-suspenders: JSONL is canonical; Postgres is the durable mirror.
  // Both run in parallel; neither throws on failure.
  await Promise.all([
    appendAuditEntry(entry),
    appendAuditPostgres(entry),
  ]);

  // ── 6. Telemetry ───────────────────────────────────────────────────
  console.info(
    '[CWH:transition]',
    JSON.stringify({
      requestId,
      auditId,
      actor: parsed.data.actor.session,
      target: parsed.data.target + '·' + parsed.data.targetId,
      verdict: result.verdict,
      ruleId: result.ruleId,
      doctrineDelta: result.doctrineDelta,
      timestamp,
    }),
  );

  const response: TransitionResponse = {
    verdict: result.verdict,
    ruleId: result.ruleId,
    doctrineDelta: result.doctrineDelta,
    reason: result.reason,
    auditId,
    timestamp,
  };

  // Cache for future replays of the same key+tuple.
  if (idemKey) {
    storeIdempotency(idemKey, parsed.data.target, parsed.data.targetId, response);
  }

  return NextResponse.json(response, {
    status: 200,
    headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId },
  });
}
