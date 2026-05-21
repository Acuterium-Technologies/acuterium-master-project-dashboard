/**
 * CampaignMode · phase filter + actor filter + per-day swimlanes
 * + Cowork failure-mode reference cards.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1637-1725.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useState } from 'react';
import { Panel, Pill } from '../ui/primitives';
import { TASKS } from '../../data';
import type { PersistedState, Task } from '../../data/types';

export type CampaignModeProps = {
  state: PersistedState;
  toggleTask: (id: string) => void;
};

const PHASES = [
  { id: 0, label: 'Phase 0 · Pre-flight (Day 0)' },
  { id: 1, label: 'Phase 1 · Six-Channel Dispatch (Days 1–3)' },
  { id: 2, label: 'Phase 2 · Fusion (Days 4–7)' },
  { id: 3, label: 'Phase 3 · Exploitation (Days 8–30)' },
];

const FAILURE_MODES: ReadonlyArray<readonly [string, string, string]> = [
  ['F.1', 'Reads only part of Playbook', 'Task graph < 80 → re-read Appendix A/C; rebuild graph'],
  ['F.2', 'Misclassifies channel dispatches', 'CH-1..CH-6 always [OPERATOR] per Edge Case 1'],
  ['F.3', 'Advances milestone without confirmation', 'Revert M-* to OPEN; no auto-advance'],
  ['F.4', 'Modifies Master_Matrix unilaterally', 'Revert; only under explicit op instruction on Day 5'],
  ['F.5', 'Cannot orchestrate to Claude', 'Reclassify as [OPERATOR] temporarily; manual paste'],
  ['F.6', 'Manus quarantine confusion', 'Release requires [CLAUDE] security-auditor scan first'],
];

export function CampaignMode({ state, toggleTask }: CampaignModeProps) {
  const [phaseFilter, setPhaseFilter] = useState<'all' | number>('all');
  const [catFilter, setCatFilter] = useState<'all' | Task['cat']>('all');

  const filtered = TASKS.filter(
    (t) =>
      (phaseFilter === 'all' || t.phase === phaseFilter) &&
      (catFilter === 'all' || t.cat === catFilter),
  );

  const byDay: Record<number, Task[]> = {};
  for (const t of filtered) {
    if (!byDay[t.day]) byDay[t.day] = [];
    byDay[t.day].push(t);
  }

  const phaseProgress = (p: number) => {
    const ts = TASKS.filter((t) => t.phase === p);
    const d = ts.filter((t) => state.done[t.id]).length;
    return { d, t: ts.length, pct: ts.length ? Math.round((d / ts.length) * 100) : 0 };
  };

  return (
    <div className="grid g-1">
      <Panel title="Campaign workflow" kicker="phase 0 → 3 · ≈50 tracked tasks">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="muted mono xs" style={{ marginRight: 8 }}>PHASE</span>
          <Pill active={phaseFilter === 'all'} onClick={() => setPhaseFilter('all')}>All</Pill>
          {PHASES.map((p) => (
            <Pill key={p.id} active={phaseFilter === p.id} onClick={() => setPhaseFilter(p.id)}>
              P{p.id}
            </Pill>
          ))}
          <span className="muted mono xs" style={{ margin: '0 8px 0 20px' }}>ACTOR</span>
          <Pill active={catFilter === 'all'} onClick={() => setCatFilter('all')}>All</Pill>
          <Pill active={catFilter === 'COWORK'} onClick={() => setCatFilter('COWORK')} extra="tag-COWORK">Cowork</Pill>
          <Pill active={catFilter === 'OPERATOR'} onClick={() => setCatFilter('OPERATOR')} extra="tag-OPERATOR">Operator</Pill>
          <Pill active={catFilter === 'CLAUDE'} onClick={() => setCatFilter('CLAUDE')} extra="tag-CLAUDE">Claude</Pill>
        </div>

        <div className="grid g-4" style={{ marginBottom: 14 }}>
          {PHASES.map((p) => {
            const pr = phaseProgress(p.id);
            return (
              <div key={p.id} className="card">
                <div className="mono xs muted" style={{ letterSpacing: '.16em' }}>{p.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cyan-bright)' }}>{pr.pct}%</span>
                  <span className="muted sm">{pr.d}/{pr.t}</span>
                </div>
                <div className="gantt-bar" style={{ marginTop: 6 }}>
                  <div className="fill" style={{ width: `${pr.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(byDay)
          .map((d) => Number(d))
          .sort((a, b) => a - b)
          .map((d) => (
            <div key={d} style={{ marginBottom: 14 }}>
              <div className="row" style={{ marginBottom: 6 }}>
                <span className="mono xs" style={{ color: 'var(--gold-prime)', letterSpacing: '.18em' }}>DAY {d}</span>
                <span className="muted xs">· {byDay[d].length} tasks</span>
              </div>
              <div className="swim">
                {(['COWORK', 'OPERATOR', 'CLAUDE'] as const).map((cat) => (
                  <div key={cat} className={`lane ${cat}`}>
                    <h4>{cat}</h4>
                    {byDay[d].filter((t) => t.cat === cat).length === 0 ? (
                      <div className="muted xs">—</div>
                    ) : null}
                    {byDay[d]
                      .filter((t) => t.cat === cat)
                      .map((t) => (
                        <div
                          key={t.id}
                          className={`task-card ${state.done[t.id] ? 'done' : ''}`}
                          onClick={() => toggleTask(t.id)}
                        >
                          <input className="chk" type="checkbox" checked={!!state.done[t.id]} readOnly />
                          <div style={{ flex: 1 }}>
                            <div className="tid">{t.id}</div>
                            <div className="tt">{t.title}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </Panel>

      <Panel title="Cowork failure-mode reference" kicker="F.1 — F.6 (brief Part F)">
        <div className="grid g-3">
          {FAILURE_MODES.map(([id, t, fix], i) => (
            <div key={i} className="card">
              <div className="sub">{id}</div>
              <h5>{t}</h5>
              <p>{fix}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
