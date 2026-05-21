/**
 * GET /api/dashboard/moe-stream · Server-Sent Events · Phase 3b.02.
 *
 * Pushes a fresh MOE activation snapshot every 5 seconds. Bearer-cookie
 * auth at the start of the stream · once the connection is open the
 * server only writes data frames.
 *
 * Aborts the interval cleanly when the client disconnects (request signal).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { NextRequest } from 'next/server';

import { createSimulator, simulateMOESnapshot } from '../../../../src/lib/moe/simulate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'acuterium-access';
const TICK_MS = 5_000;

export async function GET(req: NextRequest): Promise<Response> {
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!expected || !cookie || cookie !== expected) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const state = createSimulator(Date.now() & 0xffffffff);

  const stream = new ReadableStream({
    start(controller) {
      let cancelled = false;

      function push(): void {
        if (cancelled) return;
        try {
          const snap = simulateMOESnapshot(state);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snap)}\n\n`));
        } catch {
          /* swallow · the abort path will close the controller */
        }
      }

      push(); // initial snapshot
      const interval = setInterval(push, TICK_MS);

      req.signal.addEventListener('abort', () => {
        cancelled = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
