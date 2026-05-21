/**
 * PortfolioMode · matrix / spine / surfaces / hardware / sprints /
 * conflicts / canon tabs with portfolio-row filter pills.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1816-1962.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useState } from 'react';
import { Panel, Pill } from '../ui/primitives';
import { CANON, CONFLICTS, PORTFOLIO, SPINE, SPRINTS, SURFACES } from '../../data';

type Tab = 'matrix' | 'spine' | 'surfaces' | 'hardware' | 'sprints' | 'conflicts' | 'canon';
type Filter = 'All' | 'Critical/stub' | 'Unannounced' | 'Sovereign' | 'Hardware' | 'Repos' | 'Surfaces';

const TABS: Tab[] = ['matrix', 'spine', 'surfaces', 'hardware', 'sprints', 'conflicts', 'canon'];
const FILTERS: Filter[] = ['All', 'Critical/stub', 'Unannounced', 'Sovereign', 'Hardware', 'Repos', 'Surfaces'];

export function PortfolioMode() {
  const [filter, setFilter] = useState<Filter>('All');
  const [tab, setTab] = useState<Tab>('matrix');

  const filtered = PORTFOLIO.filter((p) => {
    switch (filter) {
      case 'All':
        return true;
      case 'Critical/stub':
        return /STUB|critical|residue/i.test(p.status) || p.confidence === 'LOW';
      case 'Unannounced':
        return /unannounced/i.test(p.status);
      case 'Sovereign':
        return p.sensitivity === 'Sovereign';
      case 'Hardware':
        return p.type === 'hardware';
      case 'Repos':
        return p.type === 'repo';
      case 'Surfaces':
        return p.type === 'live-surface';
    }
    return true;
  });

  return (
    <div className="grid g-1">
      <Panel title="Portfolio" kicker="28 items · matrix mirror · read-only from this surface">
        <div className="row" style={{ marginBottom: 10 }}>
          {TABS.map((t) => (
            <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </Pill>
          ))}
          <span className="right muted xs mono">writes route to deployed app</span>
        </div>

        {tab === 'matrix' ? (
          <>
            <div className="row" style={{ marginBottom: 8 }}>
              {FILTERS.map((f) => (
                <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
              ))}
              <span className="right muted xs mono">{filtered.length} / 28</span>
            </div>
            <div className="scroll-x">
              <table className="stack-table">
                <thead>
                  <tr>
                    <th>id</th><th>name</th><th>type</th><th>layer</th><th>status</th>
                    <th>conf</th><th>sens</th><th>channels</th><th>required action</th><th>OD</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const statusPillClass =
                      p.status.includes('STUB') || p.status.includes('residue') ? 'pill crit' : 'pill';
                    const confPillClass = p.confidence === 'LOW' ? 'pill crit' : 'pill';
                    const confStyle =
                      p.confidence === 'HIGH'
                        ? { color: 'var(--green-ok)', borderColor: 'rgba(48,209,88,.30)' }
                        : undefined;
                    return (
                      <tr key={p.id}>
                        <td data-label="id" className="id-cell">{p.id}</td>
                        <td data-label="name" style={{ fontWeight: 500 }}>{p.name}</td>
                        <td data-label="type" className="mono xs muted">{p.type}</td>
                        <td data-label="layer" className="mono xs">{p.layer}</td>
                        <td data-label="status"><span className={statusPillClass}>{p.status}</span></td>
                        <td data-label="conf"><span className={confPillClass} style={confStyle}>{p.confidence}</span></td>
                        <td data-label="sens">
                          {p.sensitivity === 'Sovereign'
                            ? <span className="pill sov">Sovereign</span>
                            : <span className="mono xs muted">{p.sensitivity}</span>}
                        </td>
                        <td data-label="channels" className="mono xs">{p.channels.join(' · ')}</td>
                        <td data-label="action" className="sm">{p.action}</td>
                        <td data-label="OD" className="mono xs" style={{ color: p.ownerDecision === 'No' ? 'var(--text-muted)' : 'var(--amber-warm)' }}>
                          {p.ownerDecision}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {tab === 'spine' ? (
          <div className="grid g-2">
            {SPINE.map((s, i) => (
              <div key={i} className={`card ${s.state === 'STUB' || s.state === 'NOT YET CREATED' ? 'gold' : ''}`}>
                <div className="row">
                  <span className="sub">{s.layer}</span>
                  <span className="right mono xs" style={{ color: 'var(--gold-prime)' }}>
                    {s.od !== 'No' ? s.od : ''}
                  </span>
                </div>
                <h5>{s.repo}</h5>
                <p>{s.purpose}</p>
                <div className="row sm" style={{ marginTop: 4 }}>
                  <span className="muted">state</span>
                  <span style={{ color: s.state === 'canonical' || s.state === 'production' ? 'var(--green-ok)' : 'var(--amber-warm)' }}>
                    {s.state}
                  </span>
                </div>
                <p className="xs muted" style={{ marginTop: 6 }}>{s.action}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'surfaces' ? (
          <div className="grid g-3">
            {SURFACES.map((s, i) => (
              <div key={i} className={`surf ${s.residue === 'HIGH' ? 'card gold' : ''}`}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{s.name}</div>
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
        ) : null}

        {tab === 'hardware' ? (
          <div className="grid g-3">
            {PORTFOLIO.filter((p) => p.type === 'hardware').map((h) => (
              <div key={h.id} className="card gold">
                <div className="sub">{h.id} · simultaneous launch line</div>
                <h5>{h.name}</h5>
                <p>{h.product} · {h.layer}</p>
                <div className="row sm">
                  <span className="muted">state</span>
                  <span style={{ color: h.status.includes('POOC') ? 'var(--green-ok)' : 'var(--amber-warm)' }}>
                    {h.status}
                  </span>
                </div>
                <p className="xs muted" style={{ marginTop: 6 }}>{h.action}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'sprints' ? (
          <div className="grid g-2">
            {SPRINTS.map((s) => (
              <div key={s.id} className="card">
                <div className="row">
                  <span className="sub">{s.id}</span>
                  <span className="right mono xs" style={{ color: 'var(--gold-prime)' }}>{s.tag}</span>
                </div>
                <h5>{s.range}</h5>
                <p className="sm">{s.scope}</p>
                <div className="row sm" style={{ marginTop: 6 }}>
                  <span className="muted">status</span>
                  <span style={{ color: s.status.includes('closed') ? 'var(--green-ok)' : 'var(--amber-warm)' }}>
                    {s.status}
                  </span>
                </div>
                <p className="xs muted" style={{ marginTop: 6 }}>{s.verify}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'conflicts' ? (
          <div className="grid g-2">
            {CONFLICTS.map((c) => (
              <div key={c.id} className={`card ${c.status === 'resolved' ? '' : 'gold'}`}>
                <div className="row">
                  <span className="sub">{c.id}</span>
                  <span className="right mono xs" style={{ color: c.status === 'resolved' ? 'var(--green-ok)' : 'var(--gold-prime)' }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <h5>{c.topic}</h5>
                <p className="sm"><strong>A:</strong> {c.srcA}<br /><strong>B:</strong> {c.srcB}</p>
                <p className="xs muted">{c.desc}</p>
                <p className="xs" style={{ color: 'var(--cyan-prime)' }}>→ {c.resolution}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'canon' ? (
          <div className="scroll-x">
            <table className="stack-table">
              <thead>
                <tr><th>canonical</th><th>forbidden variants</th></tr>
              </thead>
              <tbody>
                {CANON.map((n, i) => (
                  <tr key={i}>
                    <td data-label="canonical" className="mono" style={{ color: 'var(--cyan-prime)' }}>{n.cf}</td>
                    <td data-label="forbidden" className="mono xs muted">{n.forb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted xs mono" style={{ marginTop: 10 }}>
              23 locked forms · enforced at CI lint + UI input · master-database canonical
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
