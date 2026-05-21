/**
 * useCWHTransition · client hook that POSTs every state transition to
 * /api/cwh/transition while still rendering a synchronous optimistic
 * preview from evaluateCWH(input). The server verdict is the authority;
 * the client preview keeps the UI snappy (≤1 frame to feedback).
 *
 * Phase 2 · the v1.4 client-side cwhGate(...) at src/lib/cwh-gate.ts
 * remains in tree as the preview engine. This hook is the new entrypoint
 * for state mutations that page.tsx wires the 4 togglers through.
 *
 * Server verdict wins, but if the network fails the client preview is
 * the fallback (graceful degradation rather than blocked operator
 * actions). Failed POSTs are surfaced via the onTelemetry callback so
 * the dashboard can show a toast / counter.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useRef } from 'react';

import { evaluateCWH } from '../lib/cwh/evaluate';
import type {
  EvaluatorResult,
  TransitionRequest,
  TransitionResponse,
} from '../lib/cwh/types';

export type CWHTransitionTelemetry = {
  phase: 'preview' | 'server' | 'network_error' | 'rate_limited' | 'denied';
  preview: EvaluatorResult;
  server?: TransitionResponse;
  error?: string;
};

export type UseCWHTransitionOptions = {
  endpoint?: string;
  onTelemetry?: (t: CWHTransitionTelemetry) => void;
};

export type CWHTransitionOutcome = {
  preview: EvaluatorResult;
  server: TransitionResponse | null;
  /** True iff the operator action should be applied to local state. */
  allow: boolean;
  /** Server-supplied (preferred) or preview (fallback) reason string. */
  reason?: string;
};

export function useCWHTransition(opts: UseCWHTransitionOptions = {}) {
  const endpoint = opts.endpoint ?? '/api/cwh/transition';
  const telemetryRef = useRef(opts.onTelemetry);
  telemetryRef.current = opts.onTelemetry;

  const submit = useCallback(
    async (input: TransitionRequest): Promise<CWHTransitionOutcome> => {
      // 1. Synchronous client preview — UX never waits on the network.
      const preview = evaluateCWH(input);
      telemetryRef.current?.({ phase: 'preview', preview });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (res.status === 429) {
          telemetryRef.current?.({
            phase: 'rate_limited',
            preview,
            error: 'rate limit · retry-after ' + (res.headers.get('Retry-After') ?? '?') + 's',
          });
          // Server is authoritative — when rate-limited, treat as not-yet-applied.
          return { preview, server: null, allow: false, reason: 'rate_limited' };
        }

        if (!res.ok) {
          telemetryRef.current?.({
            phase: 'network_error',
            preview,
            error: 'server returned ' + res.status,
          });
          // Fall back to client preview so a single network blip doesn't
          // freeze the operator. Verdict is logged as "preview only".
          return {
            preview,
            server: null,
            allow: preview.verdict === 'allow',
            reason: preview.reason,
          };
        }

        const json = (await res.json()) as TransitionResponse;
        telemetryRef.current?.({ phase: 'server', preview, server: json });

        if (json.verdict === 'deny') {
          telemetryRef.current?.({ phase: 'denied', preview, server: json });
        }

        return {
          preview,
          server: json,
          allow: json.verdict === 'allow',
          reason: json.reason ?? preview.reason,
        };
      } catch (err) {
        telemetryRef.current?.({
          phase: 'network_error',
          preview,
          error: String(err),
        });
        return {
          preview,
          server: null,
          allow: preview.verdict === 'allow',
          reason: preview.reason,
        };
      }
    },
    [endpoint],
  );

  return { submit };
}
