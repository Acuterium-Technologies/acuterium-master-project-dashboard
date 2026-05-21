/**
 * MigrationMode · Sheets → Supabase → Sovereign-self-host triptych
 * plus 14-step replacement plan for master-project.acuterium.ai.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2098-2188.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { Panel } from '../ui/primitives';

const SHEETS_BACKED = [
  'Naming_Canon (23 entries · operator-editable)',
  'Dispatch log (Sheets readable during dispatch)',
  'Master_Matrix writes (28 → 80+ rows)',
  'Owner_Decisions, Conflicts, Sprint_Ledger',
  'Live_Surfaces, Hardware_Workstream',
  'Channel_Coverage, Doctrine_Spine',
  'AuditLog (append-only sheet tab)',
];

const SUPABASE_PREP = [
  '10 tables mirroring frozen contracts (§2.2 in plan)',
  'RLS roles: operator (rw) · viewer (r)',
  'Realtime subscriptions on channel + decision status',
  'Edge Function: nightly KPI recompute',
  'Edge Function: 5-min live-surface health ping',
  'Dedicated audit_log table, monthly-partitioned',
  'One-shot migration script: Sheets → CSV → seed',
];

const SOVEREIGN_ONLY: ReadonlyArray<readonly [string, string]> = [
  ['Operator-key milestone closures', 'Requires ZURD AcuKey hardware (P21 production firmware) · cryptographic sign-off'],
  ['CDMA blockchain audit anchoring', 'Baranurion-routed Q-ENC + ASIP v2 integration · tamper-evident audit log'],
  ['Provider-attributed KPI recompute', 'Diaran-AI L3 routing live · per-cell provenance verifiable'],
  ['Sovereign live-surface uptime probes', 'W-03 Watad sovereign infrastructure intelligence'],
  ['Data residency: Oman-domicile Postgres', 'Eliminates last external dependency for sensitive data'],
  ['ACAI V2 design system native integration', 'Replaces token approximation with full breathing/glassmorph/MOE matrix'],
];

const REPLACEMENT_PLAN = [
  'R-01 · Branch main → feat/unified-master-ops-v1',
  'R-02 · Add app/(unified)/page.tsx mounting UnifiedMasterOps (no removals yet)',
  'R-03 · Port ACAI V2 tokens into app/globals.css',
  'R-04 · Add components/master-ops/* (modes, charts, widgets)',
  'R-05 · Implement lib/data-adapter.ts over existing lib/sheets.ts (no write-path changes)',
  'R-06 · Mount unified UI at /v2; current / still legacy',
  'R-07 · Preview deploy on PR; QA guardrails pass',
  'R-08 · Side-by-side QA: /v2 vs / identical on portfolio rows',
  'R-09 · Add password gate to /v2 via middleware.ts',
  'R-10 · Verify Sentry receives synthetic error from /v2',
  'R-11 · Verify Vercel Analytics records /v2 traffic',
  'R-12 · Promote: app/(unified)/page.tsx → app/page.tsx; legacy → /legacy',
  'R-13 · Merge PR; vercel rollback ready as instant-revert',
  'R-14 · Day-14 cleanup: delete /legacy; archive JSX under archive/v1-jsx/',
];

export function MigrationMode() {
  return (
    <div className="grid g-1">
      <Panel title="Migration path" kicker="Sheets · Supabase · Sovereign">
        <div className="mig">
          <div className="mig-box now">
            <div className="mono xs" style={{ color: 'var(--green-ok)', letterSpacing: '.18em' }}>TODAY</div>
            <h5 style={{ margin: '8px 0' }}>Google Sheets</h5>
            <p className="sm muted">30s polling · master-project-sheet-writer service account · Sheet ID locked</p>
          </div>
          <div className="mig-arrow">→</div>
          <div className="mig-box next">
            <div className="mono xs" style={{ color: 'var(--gold-prime)', letterSpacing: '.18em' }}>NEXT · Day 60+</div>
            <h5 style={{ margin: '8px 0' }}>Supabase</h5>
            <p className="sm muted">Postgres · real-time channels · RLS · eu-central-1</p>
          </div>
          <div className="mig-arrow">→</div>
          <div className="mig-box future">
            <div className="mono xs" style={{ color: 'var(--violet-qenc)', letterSpacing: '.18em' }}>FUTURE · Day 120+</div>
            <h5 style={{ margin: '8px 0' }}>Sovereign Self-Host</h5>
            <p className="sm muted">Acuterium-controlled VPS · Baranurion · CDMA blockchain · ZURD key sign-off</p>
          </div>
        </div>
      </Panel>

      <div className="grid g-2">
        <Panel title="What stays Sheets-backed (now)" kicker="low-friction operator edits">
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {SHEETS_BACKED.map((t, i) => (
              <li key={i} className="sm">{t}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="What to prepare for Supabase" kicker="Day 60+ migration" className="gold">
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {SUPABASE_PREP.map((t, i) => (
              <li key={i} className="sm">{t}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="What belongs to sovereign self-host only" kicker="Day 120+ · post-campaign">
        <div className="grid g-3">
          {SOVEREIGN_ONLY.map(([t, d], i) => (
            <div key={i} className="card" style={{ borderColor: 'rgba(123,104,238,.30)' }}>
              <h5>{t}</h5>
              <p className="sm muted">{d}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Replacement plan · 14 steps for master-project.acuterium.ai">
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          {REPLACEMENT_PLAN.map((s, i) => (
            <li key={i} className="sm" style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>
              {s}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
