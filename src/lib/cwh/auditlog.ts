/**
 * AuditLog · ULID-keyed JSONL append-only persistence.
 * Phase 2 · in-scope per ACU-DISPATCH-SCHEMA v1.1.
 *
 * Path resolution:
 *   - Local dev / CI            → <cwd>/data/auditlog/auditlog-{YYYY-MM-DD}.jsonl
 *   - Vercel serverless runtime → /tmp/acuterium-auditlog/auditlog-{YYYY-MM-DD}.jsonl
 *   - Edge runtime              → write skipped; entry returned only (telemetry)
 *
 * Known limitation (documented in PR description):
 *   /tmp is ephemeral across serverless cold-starts on Vercel. Phase 3
 *   migrates persistence to Vercel Blob + Postgres mirror. For Phase 2
 *   the contract is "append-only file when the runtime can write".
 *
 * Each line is the FULL transition envelope:
 *   { auditId, timestamp, request, verdict, ruleId, doctrineDelta, reason? }
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { ulid } from 'ulid';
import type { EvaluatorResult, TransitionRequest } from './types';

export type AuditEntry = {
  auditId: string;
  timestamp: string;
  request: TransitionRequest;
  verdict: EvaluatorResult['verdict'];
  ruleId: EvaluatorResult['ruleId'];
  doctrineDelta: number;
  reason?: string;
};

const ULID_PREFIX = 'alog_';

export function newAuditId(): string {
  return ULID_PREFIX + ulid();
}

function isVercelServerless(): boolean {
  return Boolean(process.env.VERCEL) && process.env.NEXT_RUNTIME !== 'edge';
}

function isEdgeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === 'edge';
}

function auditDir(): string {
  if (isVercelServerless()) return '/tmp/acuterium-auditlog';
  // Fall back to <cwd>/data/auditlog/ for local dev / CI.
  return process.cwd() + '/data/auditlog';
}

function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function auditFilePath(now: Date = new Date()): string {
  return `${auditDir()}/auditlog-${todayUTC(now)}.jsonl`;
}

/**
 * Persist one transition envelope. Returns the entry unchanged so the
 * route handler can also return it in the HTTP response.
 *
 * Edge runtime: the write step is skipped (no fs); the entry is still
 * returned and logged via console.info so downstream telemetry stays
 * intact.
 */
export async function appendAuditEntry(entry: AuditEntry): Promise<AuditEntry> {
  if (isEdgeRuntime()) {
    console.info('[CWH:audit:edge]', JSON.stringify(entry));
    return entry;
  }

  // Dynamic imports keep this module compatible with edge bundling
  // (the import paths only execute when isEdgeRuntime() returned false).
  const { mkdir, appendFile } = await import('node:fs/promises');
  const dir = auditDir();
  const file = auditFilePath();
  const line = JSON.stringify(entry) + '\n';

  try {
    await mkdir(dir, { recursive: true });
    await appendFile(file, line, { encoding: 'utf8' });
  } catch (err) {
    // Telemetry-only failure mode: never crash a transition because the
    // audit sink is unwritable (e.g. read-only filesystem). The console
    // line carries the entry so it can still be observed in logs.
    console.warn('[CWH:audit:write_failed]', JSON.stringify({ entry, err: String(err) }));
  }

  return entry;
}
