-- migrations/2026-05-21-002-moe-state.sql
-- Phase 3b · MOE Expert Matrix activation snapshot table (forward compat).
-- Idempotent · safe to run multiple times.
-- Phase 3b's simulator does NOT write to this table (would generate ~17K
-- rows/day). Real DIARAN-MOE wiring (Phase 4+) will be the first writer.
--
-- Classification: ACUTERIUM-INTERNAL // SOVEREIGN

CREATE TABLE IF NOT EXISTS moe_state (
  snapshot_id    TEXT PRIMARY KEY,                  -- ULID with moe_ prefix
  ts             TIMESTAMPTZ NOT NULL,
  total_active   INTEGER NOT NULL,
  domain_counts  JSONB NOT NULL,                    -- { language: n, reasoning: n, ... }
  experts        JSONB NOT NULL,                    -- full 785-node snapshot
  channel        TEXT NOT NULL DEFAULT 'simulator', -- 'simulator' | 'diaran-moe-real'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moe_state_ts ON moe_state (ts DESC);
CREATE INDEX IF NOT EXISTS idx_moe_state_channel ON moe_state (channel);
