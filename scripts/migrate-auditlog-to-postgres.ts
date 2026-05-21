/**
 * scripts/migrate-auditlog-to-postgres.ts
 *
 * Phase 3a · idempotent backfill of existing JSONL audit entries into
 * the Postgres audit_log table (preflight rule 7.17).
 *
 * Usage:
 *   POSTGRES_URL_NON_POOLING=postgres://... npx tsx scripts/migrate-auditlog-to-postgres.ts
 *
 * Idempotency is enforced by ON CONFLICT (audit_id) DO NOTHING — running
 * this twice produces the same row count.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { sql } from '@vercel/postgres';

const AUDITLOG_DIR = path.join(process.cwd(), 'data/auditlog');

async function migrate(): Promise<void> {
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    console.error('[migrate] POSTGRES_URL not set · refusing to run');
    process.exit(1);
  }
  if (!existsSync(AUDITLOG_DIR)) {
    console.log('[migrate] no data/auditlog directory · nothing to migrate');
    return;
  }

  const files = readdirSync(AUDITLOG_DIR).filter((f) => f.endsWith('.jsonl'));
  let inserted = 0;
  let skipped = 0;
  let bad = 0;

  for (const file of files) {
    const content = readFileSync(path.join(AUDITLOG_DIR, file), 'utf8');
    const lines = content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      let entry: {
        auditId: string;
        timestamp: string;
        request: {
          target: string;
          targetId: string;
          fromState: string;
          toState: string;
          actor: { session: string };
        };
        verdict: string;
        ruleId: string;
        doctrineDelta: number;
        reason?: string;
      };
      try {
        entry = JSON.parse(line);
      } catch {
        bad++;
        continue;
      }

      try {
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

        if ((result.rowCount ?? 0) > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error('[migrate] insert failed for', entry.auditId, err);
        bad++;
      }
    }
  }

  console.log(
    `[migrate] complete · inserted=${inserted} · skipped(dup)=${skipped} · bad=${bad}`,
  );
}

migrate().catch((err) => {
  console.error('[migrate] fatal', err);
  process.exit(1);
});
