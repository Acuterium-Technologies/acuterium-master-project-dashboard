/**
 * ReportsMode · the REPORTS section tab.
 *
 * On-demand, end-of-day Master Ops status report. Generates a VISUAL report on
 * screen (metric cards + KPI/milestone/surface tables + a real-time changelog)
 * and offers a downloadable .md version — both produced from the LIVE Google
 * Sheet via /api/reports/generate (cookie-gated, server-side service account).
 * Each generation appends an audit entry, so the changelog grows in real time.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useState } from 'react';
import { Panel } from '../ui/primitives';

type Metrics = {
  tasks: { done: number; total: number };
  milestones: { closed: number; total: number };
  matrix: { rows: number; target: number };
  kpis: { total: number; achieved: number; pending: number };
  decisions: { closed: number; total: number };
};

type ReportData = {
  generatedAt: string;
  date: string;
  source: 'sheet' | 'static-fallback';
  metrics: Metrics;
  kpis: { id: string; name: string; target: string; value: string; state: string }[];
  milestones: { id: string; title: string; closed: boolean }[];
  surfaces: { name: string; url: string; host: string; announce: string; residue: string }[];
  recentAudit: { timestamp?: string; target?: string; verdict?: string }[];
  markdown: string;
};

const STATE_COLOR: Record<string, string> = {
  ACHIEVED: '#34D399',
  'ON TRACK': '#60A5FA',
  'AT RISK': '#FBBF24',
  'OFF TRACK': '#F87171',
};

function pct(n: number, d: number): string {
  return d > 0 ? Math.round((n / d) * 100) + '%' : '0%';
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        flex: '1 1 150px',
        minWidth: 140,
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(14,32,80,0.12)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--slate, #7C8DA3)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink, #DCEEFF)', lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: 'var(--muted, #6EA5EB)', marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

export function ReportsMode() {
  const [data, setData] = useState<ReportData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMd, setShowMd] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Session expired — please log in again.' : `Generation failed (HTTP ${res.status}).`);
        return;
      }
      setData((await res.json()) as ReportData);
    } catch {
      setError('Network error while generating the report.');
    } finally {
      setBusy(false);
    }
  }, []);

  const download = useCallback(() => {
    if (!data) return;
    const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACUTERIUM_MASTER_OPERATIONS_STATUS_REPORT_${data.date}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  const m = data?.metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="End-of-Day Report" kicker="Live reconciliation · Google Sheet → doctrine">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
              background: busy ? '#1F3050' : '#2563EB',
              color: '#fff',
            }}
          >
            {busy ? 'Generating…' : data ? 'Regenerate report' : 'Generate report'}
          </button>
          {data ? (
            <>
              <button
                type="button"
                onClick={download}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A3F58', background: 'transparent', color: 'var(--ink,#DCEEFF)', fontSize: 14, cursor: 'pointer' }}
              >
                ⬇ Download .md
              </button>
              <button
                type="button"
                onClick={() => setShowMd((s) => !s)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A3F58', background: 'transparent', color: 'var(--slate,#7C8DA3)', fontSize: 14, cursor: 'pointer' }}
              >
                {showMd ? 'Hide' : 'View'} markdown
              </button>
            </>
          ) : null}
          {data ? (
            <span style={{ fontSize: 12, color: 'var(--muted,#6EA5EB)', marginLeft: 'auto' }}>
              {data.source === 'sheet' ? '● live sheet' : '● static fallback'} · generated {new Date(data.generatedAt).toLocaleString('en-GB', { hour12: false })}
            </span>
          ) : null}
        </div>
        {error ? <div role="alert" style={{ marginTop: 12, color: '#F87171', fontSize: 13 }}>{error}</div> : null}
        {!data && !busy && !error ? (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--slate,#7C8DA3)' }}>
            Update tasks/milestones during the day, then generate a reconciled end-of-day report from the live backing store.
            The report renders here and downloads as a dated <code>.md</code>.
          </p>
        ) : null}
      </Panel>

      {m ? (
        <>
          <Panel title="Reconciled Metrics" kicker={`as of ${data!.date}`}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Metric label="Tasks" value={`${m.tasks.done}/${m.tasks.total}`} sub={pct(m.tasks.done, m.tasks.total) + ' complete'} />
              <Metric label="Milestones" value={`${m.milestones.closed}/${m.milestones.total}`} sub={pct(m.milestones.closed, m.milestones.total) + ' closed'} />
              <Metric label="Matrix" value={`${m.matrix.rows}/${m.matrix.target}`} sub={pct(m.matrix.rows, m.matrix.target) + ' coverage'} />
              <Metric label="KPIs achieved" value={`${m.kpis.achieved}/${m.kpis.total}`} sub={`${m.kpis.pending} pending`} />
              <Metric label="Owner decisions" value={`${m.decisions.closed}/${m.decisions.total}`} sub="closed" />
            </div>
          </Panel>

          <Panel title="KPI Validation" kicker={`${data!.kpis.length} indicators`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--slate,#7C8DA3)' }}>
                    <th style={{ padding: '6px 8px' }}>KPI</th><th style={{ padding: '6px 8px' }}>Name</th>
                    <th style={{ padding: '6px 8px' }}>Target</th><th style={{ padding: '6px 8px' }}>Value</th><th style={{ padding: '6px 8px' }}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.kpis.map((k) => (
                    <tr key={k.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{k.id}</td>
                      <td style={{ padding: '6px 8px' }}>{k.name}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--muted,#6EA5EB)' }}>{k.target}</td>
                      <td style={{ padding: '6px 8px' }}>{k.value}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700, color: STATE_COLOR[k.state] ?? '#9CA3AF' }}>{k.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Milestones" kicker={`${m.milestones.closed}/${m.milestones.total} closed`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data!.milestones.map((ms) => (
                <div key={ms.id} style={{ fontSize: 13, color: ms.closed ? 'var(--ink,#DCEEFF)' : 'var(--slate,#7C8DA3)' }}>
                  {ms.closed ? '✅' : '⬜'} <strong style={{ fontFamily: 'monospace' }}>{ms.id}</strong> — {ms.title}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Live Surfaces" kicker={`${data!.surfaces.length} surfaces`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              {data!.surfaces.map((s) => (
                <div key={s.name}>
                  <strong>{s.name}</strong> · <span style={{ color: 'var(--muted,#6EA5EB)' }}>{s.url}</span> · {s.host}
                  {s.residue && s.residue.toUpperCase() === 'HIGH' ? <span style={{ color: '#F87171' }}> · residue HIGH</span> : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Changelog · Recent Activity" kicker="real-time audit trail">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, fontFamily: 'monospace', color: 'var(--slate,#7C8DA3)' }}>
              {data!.recentAudit.length ? (
                data!.recentAudit.map((a, i) => (
                  <div key={i}>{(a.timestamp ?? '').replace('T', ' ').slice(0, 19)} · {a.target} · {a.verdict}</div>
                ))
              ) : (
                <div>No audited changes recorded in this window yet — edits you make will appear here.</div>
              )}
            </div>
          </Panel>

          {showMd ? (
            <Panel title="Markdown source" kicker="downloadable .md">
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.45, maxHeight: 420, overflow: 'auto', margin: 0, color: 'var(--ink,#DCEEFF)' }}>{data!.markdown}</pre>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
