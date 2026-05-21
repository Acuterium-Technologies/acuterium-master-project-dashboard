/**
 * OverviewMode · canonical metrics + PATHOS radar + sensitivity/lifecycle
 * pies + KPI grid + live surfaces.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1404-1634.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import type { CSSProperties } from 'react';
import { Donut, Pie, PieLegend, Radar, Sparkline, StackedBar } from '../charts';
import { Panel, Metric } from '../ui/primitives';
import {
  CONFLICTS,
  DECISIONS,
  KPIS,
  MILESTONES,
  PORTFOLIO,
  STAGE1,
  STAGE2,
  SURFACES,
  TASKS,
  FUTURE,
} from '../../data';
import type { KPI, PersistedState, PortfolioRow } from '../../data/types';

export type OverviewModeProps = {
  state: PersistedState;
  toggleMilestone: (id: string) => void;
};

function lifecyclePhase(p: PortfolioRow): string {
  const s = p.status.toLowerCase();
  if (/sunset|archived/.test(s)) return 'Sunset';
  if (/canonical|production|v[0-9]|deployed|shipped/.test(s)) return 'Production';
  if (/stub|concept/.test(s)) return 'Design';
  if (/closure pending|sprint s1 in-flight|pre-launch|build/.test(s)) return 'Build';
  if (/stopgap/.test(s)) return 'Pilot';
  return 'Integrate';
}

const KPI_STATE_COLOR: Record<KPI['state'], string> = {
  achieved: '#30D158',
  on_track: '#00E5D4',
  at_risk: '#C9A84C',
  off_track: '#FF3B30',
};

const KPI_STATE_BORDER: Record<KPI['state'], string> = {
  achieved: '48,209,88',
  on_track: '0,229,212',
  at_risk: '201,168,76',
  off_track: '255,59,48',
};

export function OverviewMode({ state, toggleMilestone }: OverviewModeProps) {
  const pathosAxes = [
    { label: 'Stress', color: '#FF6B35' },
    { label: 'Focus', color: '#00E5D4' },
    { label: 'Curiosity', color: '#7B68EE' },
    { label: 'Fatigue', color: '#C9A84C' },
    { label: 'Satisfaction', color: '#30D158' },
  ];

  const odClosedCount = DECISIONS.filter((d) => state.closedODs[d.id]).length;
  const tasksDone = TASKS.filter((t) => state.done[t.id]).length;
  const tasksPct = Math.round((tasksDone / TASKS.length) * 100);

  const stress = Math.min(
    100,
    30 +
      CONFLICTS.filter((c) => c.status === 'open').length * 4 +
      (state.residueVerdict === 'CLEAN' ? 0 : 25) +
      (state.closedODs['OD-04'] ? 0 : 15),
  );

  const pathosP0 = TASKS.filter((t) => t.phase === 0);
  const pathosP0Done = pathosP0.filter((t) => state.done[t.id]).length;
  const focus = Math.min(100, 35 + (pathosP0Done / Math.max(1, pathosP0.length)) * 55);
  const curiosity = Math.min(100, 60 + tasksPct / 3);
  const fatigue = Math.min(100, 25 + Math.max(0, 30 - odClosedCount * 4));
  const satisfaction = Math.min(100, 40 + odClosedCount * 5 + tasksPct / 3);
  const pathosValues = [stress, focus, curiosity, fatigue, satisfaction].map(Math.round);

  const sensSlices = [
    { label: 'Sovereign', n: PORTFOLIO.filter((p) => p.sensitivity === 'Sovereign').length, color: '#FF6B35' },
    { label: 'Confidential', n: PORTFOLIO.filter((p) => p.sensitivity === 'Confidential').length, color: '#C9A84C' },
    { label: 'Internal', n: PORTFOLIO.filter((p) => p.sensitivity === 'Internal').length, color: '#7B68EE' },
    { label: 'Public', n: PORTFOLIO.filter((p) => p.sensitivity === 'Public').length, color: '#00E5D4' },
  ];

  const lifecycle = ['Concept', 'Design', 'Build', 'Integrate', 'Pilot', 'Production', 'Sunset'];
  const lifecycleColors = ['#7B68EE', '#C9A84C', '#FF6B35', '#00E5D4', '#3DFFF5', '#30D158', '#6A4A8A'];
  const lifeSlices = lifecycle
    .map((l, i) => ({
      label: l,
      n: PORTFOLIO.filter((p) => lifecyclePhase(p) === l).length,
      color: lifecycleColors[i],
    }))
    .filter((s) => s.n > 0);

  const allTaskIds = TASKS.map((t) => t.id);
  const doneCount = allTaskIds.filter((id) => state.done[id]).length;
  const pct = Math.round((doneCount / TASKS.length) * 100);

  const s2Items = STAGE2.flatMap((st) => [st.id, ...st.sub.map((_, i) => `${st.id}.${i + 1}`)]);
  const s2Done = s2Items.filter((id) => state.done[id]).length;
  const s2Pct = Math.round((s2Done / s2Items.length) * 100);

  const p0Tasks = TASKS.filter((t) => t.phase === 0);
  const p0Done = p0Tasks.filter((t) => state.done[t.id]).length;
  const p0Pct = Math.round((p0Done / p0Tasks.length) * 100);

  const odClosed = DECISIONS.filter((d) => state.closedODs[d.id]).length;
  const odPct = Math.round((odClosed / DECISIONS.length) * 100);

  const msClosed = MILESTONES.filter((m) => state.closedMs[m.id]).length;
  const matrixPct = Math.round((28 / 80) * 100);

  // Roll-up reference values (unused locally but expose intent for future Stage-2 widgets)
  void STAGE1;
  void FUTURE;

  const dist = (['COWORK', 'OPERATOR', 'CLAUDE'] as const).map((c) => ({
    label: c,
    values: [
      {
        n: TASKS.filter((t) => t.cat === c).length,
        color: c === 'OPERATOR' ? '#C9A84C' : c === 'CLAUDE' ? '#7B68EE' : '#00E5D4',
        label: c,
      },
    ],
  }));

  const risk = (['Sovereign', 'Confidential', 'Internal', 'Public'] as const).map((s) => {
    const rows = PORTFOLIO.filter((p) => p.sensitivity === s);
    return {
      label: s,
      values: [
        { n: rows.filter((r) => r.confidence === 'HIGH').length, color: '#30D158', label: 'HIGH' },
        { n: rows.filter((r) => r.confidence === 'MEDIUM').length, color: '#C9A84C', label: 'MED' },
        { n: rows.filter((r) => r.confidence === 'LOW').length, color: '#FF3B30', label: 'LOW' },
      ],
    };
  });

  const day30 = [
    'Six channels reported and filed at 100%',
    'Evidence Matrix: ≥80 populated rows',
    '≥90% cross-channel conflicts resolved',
    '≥8 of 13 owner decisions closed',
    'Sprint S1 closure definitively documented',
    'acuterium-contracts schema set approved + committed',
    'Manus residue scan completed and signed',
    'All 7 live surfaces with verified URLs',
    'All 3 hardware briefs delivered',
    'Sprint S2 charter signed (v0.3.0)',
  ];

  return (
    <div className="grid g-1">
      <div className="grid g-5">
        <Panel>
          <Metric val={`${pct}%`} lab="Overall progress" sub={`${doneCount}/${TASKS.length} tasks · ${msClosed}/14 milestones`} />
        </Panel>
        <Panel>
          <Metric variant="violet" val={`${s2Pct}%`} lab="Stage 2 deployment" sub={`master-project.acuterium.ai · ${s2Done}/${s2Items.length} sub-steps`} />
        </Panel>
        <Panel>
          <Metric variant="gold" val={`${p0Done}/${p0Tasks.length}`} lab="Phase 0 pre-flight" sub={`${p0Pct}% readiness`} />
        </Panel>
        <Panel>
          <Metric variant="red" val={`${odClosed}/${DECISIONS.length}`} lab="Owner decisions" sub={`${odPct}% closed · Dr. Jay queue`} />
        </Panel>
        <Panel>
          <Metric variant="green" val="28/80" lab="Matrix coverage" sub={`${matrixPct}% of target 80 rows`} />
        </Panel>
      </div>

      <div className="grid g-3">
        <Panel title="Overall" kicker="ring">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Donut pct={pct} label="campaign" color="#00E5D4" />
          </div>
        </Panel>
        <Panel title="Stage 2 deploy" kicker="ring">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Donut pct={s2Pct} label="13 steps" color="#7B68EE" />
          </div>
        </Panel>
        <Panel title="Owner decisions" kicker="ring">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Donut pct={odPct} label="13 OD" color="#FF6B35" />
          </div>
        </Panel>
      </div>

      <div className="grid g-2">
        <Panel title="Task category distribution" kicker="cowork · operator · claude">
          <StackedBar data={dist} />
          <div className="row sm muted" style={{ marginTop: 8, justifyContent: 'space-between' }}>
            <span>Target: 54 / 35 / 11 (Cowork brief Part C.6)</span>
            <span className="mono" style={{ color: 'var(--cyan-prime)' }}>
              {TASKS.filter((t) => t.cat === 'COWORK').length}/{TASKS.filter((t) => t.cat === 'OPERATOR').length}/{TASKS.filter((t) => t.cat === 'CLAUDE').length}
            </span>
          </div>
        </Panel>
        <Panel title="Risk distribution" kicker="sensitivity × confidence">
          <StackedBar data={risk} />
          <div className="muted xs mono" style={{ marginTop: 8 }}>HIGH = green · MED = gold · LOW = red · 28 portfolio rows</div>
        </Panel>
      </div>

      <Panel title="Milestone timeline" kicker="14 milestones · M-00 → M-3.0">
        {MILESTONES.map((m) => {
          const closed = !!state.closedMs[m.id];
          const dayPct = Math.min(100, (m.day / 30) * 100);
          const stClass: CSSProperties = { cursor: 'pointer' };
          return (
            <div key={m.id} className="gantt-row">
              <div className="mid">{m.id}</div>
              <div className="mt">{m.title}</div>
              <div className="gantt-bar">
                <div className={`fill ${closed ? 'closed' : ''}`} style={{ width: `${dayPct}%` }} />
              </div>
              <div className={`st ${closed ? 'closed' : 'open'}`} style={stClass} onClick={() => toggleMilestone(m.id)}>
                {closed ? 'CLOSED' : `Day ${m.day}`}
              </div>
            </div>
          );
        })}
      </Panel>

      <div className="grid g-3">
        <Panel title="Pathos" kicker="5-axis operator state">
          <div className="donut-wrap"><Radar axes={pathosAxes} values={pathosValues} size={260} /></div>
          <div className="row sm muted" style={{ justifyContent: 'space-between', marginTop: 6 }}>
            <span className="mono xs">derived from live campaign telemetry</span>
            <span className="mono xs" style={{ color: 'var(--cyan-prime)' }}>
              S {pathosValues[0]} · F {pathosValues[1]} · C {pathosValues[2]} · Fa {pathosValues[3]} · Sa {pathosValues[4]}
            </span>
          </div>
        </Panel>
        <Panel title="Sensitivity" kicker={`${PORTFOLIO.length} items`}>
          <div className="donut-wrap"><Pie slices={sensSlices} size={180} inner={0.55} /></div>
          <div style={{ marginTop: 8 }}><PieLegend slices={sensSlices} /></div>
        </Panel>
        <Panel title="Lifecycle" kicker="L0 → Sunset">
          <div className="donut-wrap"><Pie slices={lifeSlices} size={180} inner={0.55} /></div>
          <div style={{ marginTop: 8 }}><PieLegend slices={lifeSlices} /></div>
        </Panel>
      </div>

      <div className="grid g-2">
        <Panel title="All 20 KPIs" kicker="value · target · 14-day trend">
          <div className="grid g-2">
            {KPIS.map((k) => {
              const stateColor = KPI_STATE_COLOR[k.state];
              const borderRgb = KPI_STATE_BORDER[k.state];
              return (
                <div key={k.id} className="kpi" style={{ borderColor: `rgba(${borderRgb},.30)` }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="kid">{k.id}</span>
                    <span className="mono xs" style={{ color: stateColor, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                      {k.state.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="kn">{k.name}</div>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div className="kv" style={{ color: stateColor }}>{k.value}</div>
                      <div className="kt">target {k.target}</div>
                    </div>
                    <Sparkline data={k.trend || []} w={140} h={42} color={stateColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Day-30 targets" kicker="10 outcomes">
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {day30.map((d, i) => (
              <li key={i} className="sm" style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>{d}</li>
            ))}
          </ol>
          <div className="divider" />
          <div className="sub mono xs" style={{ color: 'var(--gold-prime)', marginBottom: 6 }}>KPI STATE LEGEND</div>
          <div className="row sm" style={{ flexWrap: 'wrap', gap: 10 }}>
            <span className="chip green" style={{ padding: '3px 10px', fontSize: 9 }}><span className="dot" />ACHIEVED</span>
            <span className="chip" style={{ padding: '3px 10px', fontSize: 9, background: 'rgba(0,229,212,.08)' }}><span className="dot" />ON TRACK</span>
            <span className="chip gold" style={{ padding: '3px 10px', fontSize: 9 }}><span className="dot" />AT RISK</span>
            <span className="chip red" style={{ padding: '3px 10px', fontSize: 9 }}><span className="dot" />OFF TRACK</span>
          </div>
        </Panel>
      </div>

      <Panel title="Live surfaces" kicker="7 surfaces · announcement state">
        <div className="grid g-4">
          {SURFACES.map((s, i) => (
            <div
              key={i}
              className={`surf ${s.residue === 'HIGH' ? 'gold' : ''}`}
              style={s.residue === 'HIGH' ? { borderColor: 'var(--gold-prime)' } : undefined}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{s.name}</div>
              <div className="url">{s.url}</div>
              <div className="muted xs">{s.host}</div>
              <div className="badges">
                <span className={`chip ${s.announce === 'STOPGAP' ? 'gold' : 'red'}`} style={{ padding: '2px 8px', fontSize: 9 }}>
                  <span className="dot" />{s.announce}
                </span>
                {s.residue === 'HIGH' ? (
                  <span className="chip red" style={{ padding: '2px 8px', fontSize: 9 }}>
                    <span className="dot" />MANUS RESIDUE
                  </span>
                ) : null}
              </div>
              <div className="sm muted" style={{ marginTop: 4 }}>{s.action}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
