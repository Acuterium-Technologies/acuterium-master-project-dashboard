/**
 * DoctrineMode · composite compliance gauge + 12 doctrine cards +
 * drill-down detail + Hybrid Persuasive Tech framing templates +
 * CWH audit log preview.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2191-2365.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Donut } from '../charts';
import { Panel } from '../ui/primitives';
import { computeComposite } from '../../lib/doctrine-scoring';
import { readAudit, type AuditEntry } from '../../lib/audit-log';
import { DOCTRINES } from '../../data';
import type { PersistedState } from '../../data/types';

export type DoctrineModeProps = {
  state: PersistedState;
};

type Frame = {
  label: string;
  tag: string;
  template: string[];
  example: string;
};

const FRAMES: Record<string, Frame> = {
  arbitration: {
    label: 'Owner arbitration',
    tag: 'Dr. Jay session · 90 min',
    template: [
      '1. The decision being asked (one sentence).',
      '2. The recommended path (Claude engineering view).',
      '3. The cost of inaction (blocking dependencies, days lost).',
      '4. The arbitration ask (yes / no / amend / defer).',
    ],
    example:
      'OD-04: approve CH-6 quarantine release path — recommend security-auditor scan + sign — inaction blocks RUZN.AI launch — ask: approve scan + sign?',
  },
  anthropic: {
    label: 'Anthropic partnership briefing',
    tag: 'evidence-first · operational discipline',
    template: [
      '1. Operational discipline evidence — the matrix, the audit log, the channel coverage.',
      '2. Doctrine alignment — honest provider attribution, ASIP v2, M-PCB.',
      '3. Concrete partnership ask — single, scoped, time-bound.',
    ],
    example:
      'We coordinate 6 AI channels under 4 phases over 30 days with full audit. We attribute Claude Opus 4.7 honestly in every output. Ask: scoped partnership on legal-AI verticals for GCC.',
  },
  investor: {
    label: 'Investor deck framing',
    tag: 'moat-first · product-second',
    template: [
      '1. The moat — sovereign data layer + Omani domicile.',
      '2. The product — 7 surfaces + 19 shards + 3 hardware products.',
      '3. The traction — portfolio + sprint cadence + Day-30 deliverables.',
      '4. The ask — the round, the use of funds, the dilution.',
    ],
    example:
      'Sovereign GCC AI infrastructure under direct domicile control — productised as RUZN.AI, Finarah, BizElevate, MADA, ZURD AcuKey — cadenced via two-week sprints — raising X to ship Sprint S2 + S3.',
  },
  government: {
    label: 'Government engagement',
    tag: 'sovereign benefit · ICV alignment',
    template: [
      '1. Sovereign benefit to the Sultanate (legal AI, defence, financial intelligence).',
      '2. ICV alignment — Omani-domiciled, Omani-staffed, Omani-controlled.',
      '3. Pilot scope — one ministry, one quarter, one measurable outcome.',
    ],
    example:
      'RUZN.AI as Ministry of Justice pilot — fully sovereign, fully ICV-aligned, fully bilingual EN/AR — single quarter, single measurable: cycle-time reduction in case routing.',
  },
};

export function DoctrineMode({ state }: DoctrineModeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Refresh audit log when persisted state mutates (a toggle implies a new audit entry).
  useEffect(() => {
    setAuditLog(readAudit());
  }, [state]);

  const composite = useMemo(() => computeComposite(state), [state]);
  const sel = selected ? DOCTRINES.find((d) => d.id === selected) || null : null;
  const selScore = sel ? composite.scores.find((s) => s.id === sel.id) || null : null;

  return (
    <div className="grid g-1">
      <Panel title="Doctrine compliance" kicker={`composite · ${composite.total} sovereign doctrines`}>
        <div className="compliance-gauge">
          <Donut
            pct={composite.avg}
            size={180}
            thickness={16}
            color={composite.avg >= 80 ? '#30D158' : composite.avg >= 60 ? '#C9A84C' : '#FF3B30'}
            label="composite"
          />
          <div className="compliance-readout" style={{ flex: 1 }}>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div
                  className="num"
                  style={{
                    color:
                      composite.avg >= 80
                        ? 'var(--green-ok)'
                        : composite.avg >= 60
                        ? 'var(--gold-prime)'
                        : 'var(--red-alert)',
                  }}
                >
                  {composite.avg}
                </div>
                <div className="lab">composite score</div>
              </div>
              <div>
                <div className="num" style={{ color: 'var(--green-ok)', fontSize: 28 }}>
                  {composite.compliant}/{composite.total}
                </div>
                <div className="lab">compliant</div>
              </div>
              <div>
                <div className="num" style={{ color: 'var(--red-alert)', fontSize: 28 }}>
                  {composite.violated}
                </div>
                <div className="lab">violated</div>
              </div>
              <div>
                <div className="num" style={{ color: 'var(--gold-prime)', fontSize: 28 }}>
                  {composite.total - composite.compliant - composite.violated}
                </div>
                <div className="lab">partial</div>
              </div>
            </div>
            <div className="sub muted" style={{ marginTop: 8 }}>
              scores recompute on every state transition · click any doctrine card to drill down
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Sovereign doctrines" kicker={`${composite.total} doctrines · click to inspect`}>
        <div className="grid g-3">
          {composite.scores.map((s) => {
            const d = DOCTRINES.find((x) => x.id === s.id);
            if (!d) return null;
            return (
              <div
                key={s.id}
                className={`doctrine-card ${d.classKey}`}
                style={{
                  cursor: 'pointer',
                  outline: selected === s.id ? '1px solid var(--accent, var(--cyan-prime))' : 'none',
                }}
                onClick={() => setSelected(selected === s.id ? null : s.id)}
              >
                <div className="d-id">{s.id} · {d.short}</div>
                <h4>{d.name}</h4>
                <div className="d-tag">{d.tag}</div>
                <p>{d.summary.length > 120 ? d.summary.slice(0, 118) + '…' : d.summary}</p>
                <div className="d-meter">
                  <div className="fill" style={{ width: `${s.score}%` }} />
                </div>
                <div className="d-foot">
                  <span className="d-score">{s.score}/100</span>
                  <span className="d-state">{s.state}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {sel && selScore ? (
        <Panel title={`Doctrine · ${sel.id}`} kicker={sel.short.toLowerCase()}>
          <div className="doctrine-detail">
            <h3>{sel.name}</h3>
            <div className="d-subtitle">
              {sel.tag} · score {selScore.score}/100 · {selScore.state}
            </div>
            <p className="sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>{sel.summary}</p>
            <div className="divider" />
            <div className="sub mono xs" style={{ color: 'var(--gold-prime)', marginBottom: 8 }}>PRINCIPLES</div>
            {sel.principles.map((p, i) => {
              const m = p.match(/^(P\d+) · (.*)$/);
              return (
                <div key={i} className="principle">
                  <span className="p-num">{m ? m[1] : ''}</span>
                  <span className="p-text">{m ? m[2] : p}</span>
                </div>
              );
            })}
            <div className="divider" />
            <div className="row sm" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span className="muted mono xs">evidence</span>
              <span className="mono xs" style={{ color: 'var(--cyan-prime)' }}>{selScore.evidence}</span>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel title="Hybrid Persuasive Tech · framing templates" kicker="arbitration · anthropic · investor · government">
        <div className="grid g-2">
          {Object.entries(FRAMES).map(([k, f]) => (
            <div key={k} className="card" style={{ borderColor: 'rgba(245,208,122,.35)' }}>
              <div className="sub" style={{ color: 'var(--gold-prime)' }}>{f.tag}</div>
              <h5>{f.label}</h5>
              <ol style={{ paddingLeft: 18, margin: '8px 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {f.template.map((s, i) => (
                  <li key={i}>{s.replace(/^\d+\. /, '')}</li>
                ))}
              </ol>
              <div className="divider" style={{ margin: '8px 0' }} />
              <div className="muted xs mono" style={{ marginBottom: 4 }}>EXAMPLE</div>
              <p className="sm" style={{ fontStyle: 'italic', color: 'var(--gold-bright)', lineHeight: 1.45 }}>
                {f.example}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="CWH audit log" kicker="every state transition is recorded" className="gold">
        {auditLog.length === 0 ? (
          <p className="sm muted">
            No audited transitions yet. Toggle a task, milestone, or owner decision to populate the audit log.
          </p>
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {auditLog.slice(0, 30).map((e, i) => (
              <div
                key={i}
                className="row sm"
                style={{ padding: '6px 0', borderBottom: '1px dashed rgba(0,229,212,.08)', gap: 10, flexWrap: 'wrap' }}
              >
                <span className="mono xs muted" style={{ minWidth: 140 }}>
                  {new Date(e.ts).toLocaleString('en-GB', { hour12: false })}
                </span>
                <span className="mono xs" style={{ color: 'var(--gold-prime)', minWidth: 80 }}>{e.actor}</span>
                <span
                  className="mono xs"
                  style={{ color: e.action.includes('denied') ? 'var(--red-alert)' : 'var(--cyan-prime)', minWidth: 160 }}
                >
                  {e.action}
                </span>
                <span className="mono xs">{e.resource}</span>
                {e.before !== undefined && e.after !== undefined ? (
                  <span className="muted xs">{JSON.stringify(e.before)} → {JSON.stringify(e.after)}</span>
                ) : null}
                {e.reason ? <span className="xs" style={{ color: 'var(--amber-warm)' }}>{e.reason}</span> : null}
              </div>
            ))}
            <div className="muted xs mono" style={{ marginTop: 8 }}>
              {auditLog.length} entries · capped at 500 · stored in localStorage
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
