-- migrations/2026-05-21-001-audit-log.sql
-- Phase 3a · Postgres durable mirror for the CWH AuditLog.
-- Idempotent · safe to run multiple times (preflight rule 7.17).
-- Classification: ACUTERIUM-INTERNAL // SOVEREIGN

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id        TEXT PRIMARY KEY,           -- ULID with alog_ prefix
  ts              TIMESTAMPTZ NOT NULL,       -- ISO-8601 from request
  actor_session   TEXT NOT NULL,
  target          TEXT NOT NULL,              -- 4 base + 6 update variants (Phase 3a preflight 7.4)
  target_id       TEXT NOT NULL,
  from_state      TEXT NOT NULL,
  to_state        TEXT NOT NULL,
  verdict         TEXT NOT NULL,              -- 'allow' | 'deny'
  rule_id         TEXT NOT NULL,              -- 'CWH-R-01' .. 'CWH-R-12'
  doctrine_delta  NUMERIC(5, 2) NOT NULL,
  reason          TEXT,
  raw_request     JSONB NOT NULL,             -- full transition envelope for forward-compat
  channel         TEXT NOT NULL DEFAULT 'CH-2',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only enforcement at the database layer.
CREATE OR REPLACE FUNCTION audit_log_no_update_delete() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only · % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_update_delete();

DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_update_delete();

-- Indexes for the most common queries.
CREATE INDEX IF NOT EXISTS idx_audit_log_ts        ON audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_session   ON audit_log (actor_session);
CREATE INDEX IF NOT EXISTS idx_audit_log_target    ON audit_log (target, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_rule      ON audit_log (rule_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_verdict   ON audit_log (verdict) WHERE verdict = 'deny';
