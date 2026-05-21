/**
 * useCWHTransition · client hook that POSTs every state transition to
 * /api/cwh/transition while still rendering a synchronous optimistic
 * preview from evaluateCWH(input). The server verdict is the authority;
 * the client preview keeps the UI snappy (≤1 frame to feedback).
 *
 * Phase 2 · introduced the hook + server CWH evaluator.
 * Phase 3a · spec 04 adds:
 *   1. Auto-generated idempotency key per logical user action (one ULID
 *      per submit() call, reused across retries within that call).
 *   2. Bounded retry-with-backoff on 429 (3 attempts max, honoring
 *      Retry-After) and network failure.
 *   3. New telemetry phases: 'idempotency_replay' when the server signals
 *      X-Idempotency-Replay (we hit the cache, no new audit row).
 *
 * Server verdict still wins. Two separate user actions = two separate
 * submit() calls = two separate ULIDs = two audit rows (correct intent
 * semantics — only retries within ONE call dedupe).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useRef } from 'react';
import { ulid } from 'ulid';

import { evaluateCWH } from '../lib/cwh/evaluate';
import type {
  EvaluatorResult,
  TransitionRequest,
  TransitionResponse,
} from '../lib/cwh/types';

export type CWHTransitionTelemetry = {
  phase:
    | 'preview'
    | 'server'
    | 'network_error'
    | 'rate_limited'
    | 'denied'
    | 'idempotency_replay';
  preview: EvaluatorResult;
  server?: TransitionResponse;
  error?: string;
};

export type UseCWHTransitionOptions = {
  endpoint?: string;
  onTelemetry?: (t: CWHTransitionTelemetry) => void;
  maxRetries?: number;
};

export type CWHTransitionOutcome = {
  preview: EvaluatorResult;
  server: TransitionResponse | null;
  /** True iff the operator action should be applied to local state. */
  allow: boolean;
  /** Server-supplied (preferred) or preview (fallback) reason string. */
  reason?: string;
  /** True if the server replayed a cached response (no new audit row). */
  replay?: boolean;
};

const DEFAULT_MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCWHTransition(opts: UseCWHTransitionOptions = {}) {
  const endpoint = opts.endpoint ?? '/api/cwh/transition';
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const telemetryRef = useRef(opts.onTelemetry);
  telemetryRef.current = opts.onTelemetry;

  const submit = useCallback(
    async (input: TransitionRequest): Promise<CWHTransitionOutcome> => {
      // 1. Synchronous client preview — UX never waits on the network.
      const preview = evaluateCWH(input);
      telemetryRef.current?.({ phase: 'preview', preview });

      // 2. Generate one ULID per logical user action. Retries within
      //    this call reuse it; the server's idempotency cache treats
      //    them as duplicates of one intent (no double audit row).
      const idempotencyKey = input.idempotencyKey ?? ulid();
      const payload: TransitionRequest = { ...input, idempotencyKey };

      let lastError: string | undefined;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (res.status === 429) {
            const retryAfterSec = Number(res.headers.get('Retry-After') ?? '1');
            telemetryRef.current?.({
              phase: 'rate_limited',
              preview,
              error: 'rate limit · retry-after ' + retryAfterSec + 's',
            });
            if (attempt + 1 < maxRetries) {
              await sleep(retryAfterSec * 1000);
              continue;
            }
            // Out of retries: surface as not-applied (server is authoritative).
            return { preview, server: null, allow: false, reason: 'rate_limited' };
          }

          if (!res.ok) {
            lastError = 'server returned ' + res.status;
            telemetryRef.current?.({ phase: 'network_error', preview, error: lastError });
            // Hard failures (400/401/403/409) don't retry; transient ones could,
            // but for Phase 3a we keep behavior simple — only 429 retries.
            return {
              preview,
              server: null,
              allow: preview.verdict === 'allow',
              reason: preview.reason,
            };
          }

          const json = (await res.json()) as TransitionResponse;
          const replay = res.headers.get('X-Idempotency-Replay') === '1';

          if (replay) {
            telemetryRef.current?.({ phase: 'idempotency_replay', preview, server: json });
          } else {
            telemetryRef.current?.({ phase: 'server', preview, server: json });
          }

          if (json.verdict === 'deny') {
            telemetryRef.current?.({ phase: 'denied', preview, server: json });
          }

          return {
            preview,
            server: json,
            allow: json.verdict === 'allow',
            reason: json.reason ?? preview.reason,
            replay,
          };
        } catch (err) {
          lastError = String(err);
          telemetryRef.current?.({ phase: 'network_error', preview, error: lastError });
          if (attempt + 1 < maxRetries) {
            await sleep(500 * (attempt + 1));
            continue;
          }
        }
      }

      // All retries exhausted · fall back to client preview so a single
      // network blip doesn't freeze the operator.
      return {
        preview,
        server: null,
        allow: preview.verdict === 'allow',
        reason: preview.reason,
      };
    },
    [endpoint, maxRetries],
  );

  return { submit };
}
