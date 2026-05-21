/**
 * BuildMode · Stage 1 done · Stage 2 step-expander · deployment health.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1728-1812.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useState } from 'react';
import { Donut } from '../charts';
import { Panel } from '../ui/primitives';
import { META } from '../../data/meta';
import { STAGE1, STAGE2 } from '../../data';
import type { PersistedState } from '../../data/types';

export type BuildModeProps = {
  state: PersistedState;
  toggleTask: (id: string) => void;
};

const DEPLOYMENT_HEALTH: ReadonlyArray<{ l: string; v: string; ok: boolean; m: string }> = [
  { l: 'Vercel deployment', v: 'PROMOTED · 200', ok: true, m: 'master-project.acuterium.ai' },
  { l: 'Google Sheets data', v: 'CONNECTED · 30s sync', ok: true, m: 'service-account writer' },
  { l: 'Sentry observability', v: 'ACTIVE · sample 1.0', ok: true, m: '@sentry/nextjs 8.42.0' },
  { l: 'Vercel Analytics', v: 'RECORDING', ok: true, m: '@vercel/analytics' },
  { l: 'Password gate', v: 'ACTIVE', ok: true, m: 'middleware.ts · access-token cookie' },
  { l: 'DNS · TLS', v: 'GREEN', ok: true, m: 'CNAME → cname.vercel-dns.com' },
];

export function BuildMode({ state, toggleTask }: BuildModeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const tog = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const s2Items = STAGE2.flatMap((st) => [st.id, ...st.sub.map((_, i) => `${st.id}.${i + 1}`)]);
  const s2Done = s2Items.filter((id) => state.done[id]).length;
  const s2Pct = Math.round((s2Done / s2Items.length) * 100);

  return (
    <div className="grid g-1">
      <Panel title="Stage 1 · Conversational artefact" kicker="5 deliverables · operational" className="gold">
        {STAGE1.map((s) => (
          <div key={s.id} className="task-card done" style={{ margin: '4px 0' }}>
            <input className="chk" type="checkbox" checked readOnly />
            <div style={{ flex: 1 }}>
              <div className="tid">{s.id}</div>
              <div className="tt">{s.title}</div>
            </div>
            <span className="chip green" style={{ padding: '2px 8px', fontSize: 9 }}>
              <span className="dot" />DELIVERED
            </span>
          </div>
        ))}
      </Panel>

      <Panel title="Stage 2 · master-project.acuterium.ai" kicker={`13 steps · ${s2Pct}% complete`}>
        <div className="row" style={{ marginBottom: 14 }}>
          <Donut pct={s2Pct} size={120} thickness={10} label="13 steps" color="#7B68EE" />
          <div className="grid g-2" style={{ flex: 1, marginLeft: 18 }}>
            <div className="card">
              <div className="sub">SHEET ID</div>
              <h5 className="mono" style={{ wordBreak: 'break-all', fontSize: 11 }}>{META.sheetId}</h5>
            </div>
            <div className="card">
              <div className="sub">DOMAIN</div>
              <h5 className="mono" style={{ fontSize: 12 }}>{META.surface}</h5>
            </div>
            <div className="card">
              <div className="sub">REPO</div>
              <h5 className="mono" style={{ fontSize: 10 }}>{META.repo}</h5>
            </div>
            <div className="card">
              <div className="sub">LOCAL MIRROR</div>
              <h5 className="mono" style={{ fontSize: 11 }}>{META.localMirror}</h5>
            </div>
          </div>
        </div>

        {STAGE2.map((st) => {
          const allIds = [st.id, ...st.sub.map((_, i) => `${st.id}.${i + 1}`)];
          const done = allIds.filter((id) => state.done[id]).length;
          const pct = Math.round((done / allIds.length) * 100);
          return (
            <div key={st.id} className="step">
              <div className="step-head" onClick={() => tog(st.id)}>
                <div className="sid">{st.id}</div>
                <div className="stitle">{st.title}</div>
                <div className="scount">{done}/{allIds.length} · {pct}%</div>
                <div className="gantt-bar" style={{ width: 80 }}>
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="mono xs muted">{expanded[st.id] ? '▾' : '▸'}</span>
              </div>
              {expanded[st.id] ? (
                <div className="step-body">
                  {st.sub.map((subTitle, i) => {
                    const sid = `${st.id}.${i + 1}`;
                    return (
                      <div
                        key={sid}
                        className={`task-card ${state.done[sid] ? 'done' : ''}`}
                        onClick={() => toggleTask(sid)}
                      >
                        <input className="chk" type="checkbox" checked={!!state.done[sid]} readOnly />
                        <div style={{ flex: 1 }}>
                          <div className="tid">{sid}</div>
                          <div className="tt">{subTitle}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </Panel>

      <Panel title="Deployment health" kicker="live observability">
        <div className="grid g-3">
          {DEPLOYMENT_HEALTH.map((d, i) => (
            <div key={i} className="card">
              <div className="sub">{d.l}</div>
              <h5
                className={d.ok ? '' : 'muted'}
                style={{ color: d.ok ? 'var(--green-ok)' : 'var(--text-muted)' }}
              >
                {d.v}
              </h5>
              <p className="mono xs">{d.m}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
