# Spec 3a.01 · Postgres AuditLog Mirror

**Sub-phase:** 3a
**Owner:** Claude Code (engineering) · Perplexity (custodian)
**Status:** Approved for implementation
**Estimated time:** 45 min

---

## Why

Phase 2's `/api/cwh/transition` writes audit entries to a JSONL file at `data/auditlog/auditlog-YYYY-MM-DD.jsonl`. On Vercel serverless, `/tmp` is ephemeral per cold-start, so JSONL is **observable in logs** but **not durable across deploys**. Phase 3a promotes AuditLog to a Postgres-backed durable store with a Vercel Blob mirror for raw JSONL backup.

## Out of scope (Phase 4+)

- WebSocket push for AuditLog stream
- Multi-region replication
- Cross-instance rate-limit promotion (stays in-memory LRU)
- AuditLog query API for the dashboard UI

## Database choice

**Vercel Postgres** (their managed Neon-based offering) — already supported by their build pipeline, zero extra infra, connection pooling via `@vercel/postgres`, schema migrations via raw SQL files. If operator later prefers a sovereign Postgres (Railway / Digital Ocean / Hetzner) the connection string is the only env var to change.

## Schema

```sql
-- migrations/2026-05-21-001-audit-log.sql

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id        TEXT PRIMARY KEY,           -- ULID with alog_ prefix
  ts              TIMESTAMPTZ NOT NULL,       -- ISO-8601 from request
  actor_session   TEXT NOT NULL,
  target          TEXT NOT NULL,              -- 'task' | 'milestone' | 'od' | 'residue' | future: '*-update'
  target_id       TEXT NOT NULL,
  from_state      TEXT NOT NULL,
  to_state        TEXT NOT NULL,
  verdict         TEXT NOT NULL,              -- 'allow' | 'deny'
  rule_id         TEXT NOT NULL,              -- 'CWH-R-01' .. 'CWH-R-12'
  doctrine_delta  NUMERIC(5, 2) NOT NULL,     -- e.g. -1.50, +0.30
  reason          TEXT,                       -- nullable
  raw_request     JSONB NOT NULL,             -- full transition envelope for forward-compat
  channel         TEXT NOT NULL DEFAULT 'CH-2',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only constraint via trigger
CREATE OR REPLACE FUNCTION audit_log_no_update_delete() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only · % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_update_delete();

CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_update_delete();

-- Indexes for the most common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_ts        ON audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_session   ON audit_log (actor_session);
CREATE INDEX IF NOT EXISTS idx_audit_log_target    ON audit_log (target, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_rule      ON audit_log (rule_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_verdict   ON audit_log (verdict) WHERE verdict = 'deny';
```

## Migration script (Phase 2 JSONL → Postgres)

`scripts/migrate-auditlog-to-postgres.ts` — idempotent, safe to run multiple times:

```typescript
import { sql } from '@vercel/postgres';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const AUDITLOG_DIR = path.join(process.cwd(), 'data/auditlog');

async function migrate() {
  const files = readdirSync(AUDITLOG_DIR).filter(f => f.endsWith('.jsonl'));
  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const content = readFileSync(path.join(AUDITLOG_DIR, file), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const entry = JSON.parse(line);
      const result = await sql`
        INSERT INTO audit_log (
          audit_id, ts, actor_session, target, target_id,
          from_state, to_state, verdict, rule_id, doctrine_delta,
          reason, raw_request, channel
        )
        VALUES (
          ${entry.auditId}, ${entry.timestamp}, ${entry.request.actor.session},
          ${entry.request.target}, ${entry.request.targetId},
          ${entry.request.fromState}, ${entry.request.toState},
          ${entry.verdict}, ${entry.ruleId}, ${entry.doctrineDelta},
          ${entry.reason ?? null}, ${JSON.stringify(entry.request)}::jsonb,
          'CH-2'
        )
        ON CONFLICT (audit_id) DO NOTHING
        RETURNING audit_id;
      `;

      if (result.rowCount > 0) inserted++; else skipped++;
    }
  }

  console.log(`Migration complete · inserted=${inserted} · skipped(dup)=${skipped}`);
}

migrate().catch(e => { console.error(e); process.exit(1); });
```

## Route changes — `app/api/cwh/transition/route.ts`

Add Postgres write **after** the JSONL append, not in place of it. Belt-and-suspenders during transition:

```typescript
// After existing JSONL append in src/lib/cwh/auditlog.ts
import { sql } from '@vercel/postgres';

export async function appendAuditPostgres(envelope: AuditEnvelope) {
  try {
    await sql`
      INSERT INTO audit_log (
        audit_id, ts, actor_session, target, target_id,
        from_state, to_state, verdict, rule_id, doctrine_delta,
        reason, raw_request, channel
      )
      VALUES (
        ${envelope.auditId}, ${envelope.timestamp}, ${envelope.request.actor.session},
        ${envelope.request.target}, ${envelope.request.targetId},
        ${envelope.request.fromState}, ${envelope.request.toState},
        ${envelope.verdict}, ${envelope.ruleId}, ${envelope.doctrineDelta},
        ${envelope.reason ?? null}, ${JSON.stringify(envelope.request)}::jsonb,
        'CH-2'
      )
      ON CONFLICT (audit_id) DO NOTHING;
    `;
  } catch (err) {
    // Postgres failure must NOT block the response · log + fall back to JSONL only
    console.error('[auditlog] postgres write failed, JSONL remains canonical', err);
  }
}
```

## Env vars

| Name | Purpose | Where set |
|---|---|---|
| `POSTGRES_URL` | Vercel Postgres connection string | Vercel project env (auto-injected if Vercel Postgres provisioned) |
| `POSTGRES_URL_NON_POOLING` | For migration script | Vercel project env |
| `AUDIT_HOT_DAYS` | Retention window in Postgres (default 90) | Vercel project env |
| `AUDIT_BLOB_BACKUP_ENABLED` | Toggle Vercel Blob mirror | Vercel project env (default: `true`) |

If `POSTGRES_URL` is unset, the route MUST fall back to JSONL-only and log a warning. Phase 3a must NOT require Postgres to be provisioned for the deploy to succeed (graceful degradation).

## Vercel Blob mirror

`src/lib/cwh/blob-backup.ts`:

```typescript
import { put } from '@vercel/blob';

export async function backupAuditLogToBlob(date: string, content: string) {
  if (process.env.AUDIT_BLOB_BACKUP_ENABLED !== 'true') return;

  try {
    await put(
      `auditlog/auditlog-${date}.jsonl`,
      content,
      { access: 'private', addRandomSuffix: false }
    );
  } catch (err) {
    console.error('[auditlog] blob backup failed', err);
  }
}
```

Triggered hourly by a Vercel Cron in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/backup-auditlog", "schedule": "0 * * * *" }
  ]
}
```

## Tests (Vitest)

`src/lib/cwh/postgres.test.ts` — at minimum:

1. Migration script is idempotent (run twice, no duplicate rows, no errors)
2. `appendAuditPostgres` survives a connection failure (does not throw)
3. Trigger blocks UPDATE/DELETE attempts (raises expected exception)
4. JSONB `raw_request` round-trips through `JSON.parse(JSON.stringify(envelope.request))`
5. ULID PK uniqueness enforced (second insert with same `audit_id` is silent no-op via `ON CONFLICT`)

## Preflight rule 7.17 (NEW)

> **Postgres migration is idempotent** — running the migration script twice produces the same row count, no duplicate inserts, no errors. Verify via:
> ```bash
> npm run migrate:auditlog
> ROWS_AFTER_1=$(psql $POSTGRES_URL -c "SELECT COUNT(*) FROM audit_log;" -tA)
> npm run migrate:auditlog
> ROWS_AFTER_2=$(psql $POSTGRES_URL -c "SELECT COUNT(*) FROM audit_log;" -tA)
> [ "$ROWS_AFTER_1" = "$ROWS_AFTER_2" ] || exit 1
> ```

## Doctrinal red-lines

- Append-only enforced at database level (trigger), not just application level
- No `DELETE` ever runs against `audit_log` in normal operation
- ULID format `alog_<26 chars>` enforced by Zod on request side
- JSONB `raw_request` preserves the full transition envelope verbatim for forward compatibility
- Postgres failure does NOT block the API response (JSONL remains the legal audit trail until Postgres confirms)
- Iron Rule: if Postgres is offline, the gate continues to function via JSONL fallback

## Acceptance criteria

- [ ] `migrations/2026-05-21-001-audit-log.sql` runs cleanly against a fresh Postgres instance
- [ ] `scripts/migrate-auditlog-to-postgres.ts` migrates existing JSONL files without duplicates
- [ ] `appendAuditPostgres()` writes to Postgres on every successful CWH transition
- [ ] Vercel Blob mirror runs hourly and contains the day's JSONL
- [ ] Preflight rule 7.17 passes
- [ ] All 5 Vitest assertions pass
- [ ] `npm run build` clean · bundle delta < +5 kB first-load (server-only deps)
- [ ] Postgres URL unset → graceful JSONL-only mode (no crashes)
