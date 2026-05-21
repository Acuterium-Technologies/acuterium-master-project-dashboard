/**
 * Postgres / Blob graceful-degradation tests · Phase 3a.01.
 *
 * Without a live Postgres instance we test the contract that matters
 * MOST for sovereign code: failure paths NEVER throw, and the absence of
 * env vars produces a clean degraded state (not a crash). The schema /
 * trigger / index tests live alongside the migration SQL and are run
 * against a real DB in CI.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appendAuditPostgres, type AuditEntry } from './auditlog';
import { backupAuditLogToBlob } from './blob-backup';

function entry(): AuditEntry {
  return {
    auditId: 'alog_01TESTAAAAAAAAAAAAAAAAAAAA',
    timestamp: '2026-05-21T10:00:00.000Z',
    request: {
      target: 'task',
      targetId: 'T-001',
      fromState: 'open',
      toState: 'done',
      actor: {
        session: 'sess_test',
        pathos: { stress: 40, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
      },
      context: { kairosMode: 'AUI', doctrineScore: 75 },
    },
    verdict: 'allow',
    ruleId: 'CWH-R-04',
    doctrineDelta: 0.3,
    reason: 'legal task transition',
  };
}

describe('Postgres mirror · graceful degradation (Phase 3a.01)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('POSTGRES_URL unset → no-op, ok=false, no throw', async () => {
    vi.stubEnv('POSTGRES_URL', '');
    const result = await appendAuditPostgres(entry());
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('POSTGRES_URL');
  });

  it('edge runtime → no-op, ok=false, no throw', async () => {
    vi.stubEnv('POSTGRES_URL', 'postgres://x');
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const result = await appendAuditPostgres(entry());
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('edge');
  });

  it('JSONB raw_request round-trips through JSON.stringify safely', () => {
    const e = entry();
    const round = JSON.parse(JSON.stringify(e.request));
    expect(round.target).toBe(e.request.target);
    expect(round.actor.pathos.stress).toBe(40);
    expect(round.context.kairosMode).toBe('AUI');
  });
});

describe('Blob backup · graceful degradation (Phase 3a.01)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('AUDIT_BLOB_BACKUP_ENABLED !== true → skipped', async () => {
    vi.stubEnv('AUDIT_BLOB_BACKUP_ENABLED', 'false');
    const result = await backupAuditLogToBlob();
    expect(result.uploaded).toBe(false);
    expect(result.reason).toContain('AUDIT_BLOB_BACKUP_ENABLED');
  });

  it('enabled but BLOB_READ_WRITE_TOKEN unset → skipped', async () => {
    vi.stubEnv('AUDIT_BLOB_BACKUP_ENABLED', 'true');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    const result = await backupAuditLogToBlob();
    expect(result.uploaded).toBe(false);
    expect(result.reason).toContain('BLOB_READ_WRITE_TOKEN');
  });

  it('edge runtime → skipped (fs unavailable)', async () => {
    vi.stubEnv('AUDIT_BLOB_BACKUP_ENABLED', 'true');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'fake-token');
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const result = await backupAuditLogToBlob();
    expect(result.uploaded).toBe(false);
    expect(result.reason).toContain('edge');
  });
});
