/**
 * ChannelsMode · six-channel dispatch board + CH-6 quarantine residue
 * control + channels-x-layer coverage heatmap + Sankey fusion flow.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1966-2069.
 *
 * Doctrinal red lines preserved: CH-6 Manus quarantine retains its gold
 * border and verdict transitions still pass through the CWH gate
 * elsewhere (the gate enforces NOT-RUN → CLEAN blocking).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { Heatmap, Sankey } from '../charts';
import { Panel, Pill } from '../ui/primitives';
import { cwhGate, RESIDUE_VERDICTS } from '../../lib/cwh-gate';
import { CHANNELS, PORTFOLIO } from '../../data';
import type { PersistedState, ResidueVerdict } from '../../data/types';

export type ChannelsModeProps = {
  state: PersistedState;
  setResidue: (v: ResidueVerdict) => void;
};

const LAYERS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'sec', 'sprint', 'cross'];

function attemptResidueChange(
  before: ResidueVerdict,
  after: ResidueVerdict,
  apply: (v: ResidueVerdict) => void,
): void {
  if (before === after) return;
  const result = cwhGate({ kind: 'residue', id: 'CH-6', before, after });
  if (result.allow) apply(after);
}

export function ChannelsMode({ state, setResidue }: ChannelsModeProps) {
  const verdict: ResidueVerdict = state.residueVerdict || 'NOT-RUN';

  const map = CHANNELS.map((ch) =>
    LAYERS.map(
      (L) =>
        PORTFOLIO.filter((p) => p.channels.includes(ch.id) && (p.layer === L || p.layer.startsWith(L))).length,
    ),
  );

  const channelTotals = CHANNELS.map((ch) => ({
    id: ch.id,
    label: ch.id,
    color: ch.id === 'CH-6' ? '#C9A84C' : ch.id === 'CH-4' ? '#30D158' : '#00E5D4',
    v: PORTFOLIO.filter((p) => p.channels.includes(ch.id)).length || 2,
  }));

  const norm = channelTotals.map((c) => ({
    id: `N-${c.id}`,
    label: `N · ${c.id}`,
    color: c.color,
    v: c.v,
  }));

  const fusion = [{
    id: 'F-FUSION',
    label: 'FUSION',
    color: '#7B68EE',
    v: channelTotals.reduce((s, c) => s + c.v, 0),
  }];

  const matrix = [
    { id: 'M-MATRIX-NOW', label: 'Matrix · 28', color: '#00E5D4' },
    { id: 'M-MATRIX-GAP', label: 'Gap to ≥80', color: '#FF6B35' },
    { id: 'M-QUARANTINE', label: 'Quarantine', color: '#C9A84C' },
  ];

  const stages = [channelTotals, norm, fusion, matrix];
  const links: Array<{ from: string; to: string; value: number; color: string }> = [];

  for (const c of channelTotals) {
    links.push({ from: c.id, to: `N-${c.id}`, value: c.v, color: c.color });
  }
  for (const n of norm) {
    if (n.id === 'N-CH-6') {
      links.push({ from: n.id, to: 'M-QUARANTINE', value: n.v, color: n.color });
    } else {
      links.push({ from: n.id, to: 'F-FUSION', value: n.v, color: n.color });
    }
  }

  const fusionTotal = fusion[0].v;
  const toNow = Math.min(28, fusionTotal);
  const toGap = Math.max(0, fusionTotal - toNow);
  links.push({ from: 'F-FUSION', to: 'M-MATRIX-NOW', value: toNow, color: '#00E5D4' });
  if (toGap > 0) {
    links.push({ from: 'F-FUSION', to: 'M-MATRIX-GAP', value: toGap, color: '#FF6B35' });
  }

  return (
    <div className="grid g-1">
      <Panel title="Six-channel dispatch board" kicker="CH-1 → CH-6 · fusion completeness">
        <div className="grid g-3">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className={`card ${ch.id === 'CH-6' ? 'gold' : ''}`}>
              <div className="row">
                <span className="sub">{ch.id}</span>
                <span className="right">
                  {ch.id === 'CH-6' ? (
                    <span className="chip gold" style={{ padding: '2px 8px', fontSize: 9 }}>
                      <span className="dot" />QUARANTINE
                    </span>
                  ) : ch.status === 'bundle_ready' ? (
                    <span className="chip green" style={{ padding: '2px 8px', fontSize: 9 }}>
                      <span className="dot" />BUNDLE READY
                    </span>
                  ) : (
                    <span className="chip" style={{ padding: '2px 8px', fontSize: 9 }}>
                      <span className="dot" />{ch.status.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>
              <h5>{ch.name}</h5>
              <p className="muted xs mono">{ch.surface}</p>
              <p className="sm" style={{ marginTop: 8 }}><strong>Access:</strong> {ch.access}</p>
              <p className="sm"><strong>Coverage:</strong> {ch.coverage}</p>
              <p className="mono xs muted" style={{ marginTop: 6 }}>→ {ch.output}</p>
              {ch.note ? <p className="xs" style={{ color: 'var(--gold-prime)', marginTop: 6 }}>{ch.note}</p> : null}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="CH-6 Manus quarantine" kicker="Golden Rule #4 · residue scan required" className="gold">
        <div className="quarantine">
          <div className="label">
            <span style={{ fontSize: 14 }}>⚠</span> QUARANTINE ZONE · structurally isolated · no merge until verdict = CLEAN
          </div>
          <p className="sm">
            CH-6 Manus report exists in{' '}
            <code className="mono" style={{ color: 'var(--gold-prime)' }}>02-reports-raw/CH-6-manus-QUARANTINE/</code>.
            The security-auditor must produce an explicit verdict before any fusion intake. The dashboard prevents
            merge until verdict transitions to <code>CLEAN</code>. RUZN.AI (P18) and any other Manus-touched surface
            inherits this gate.
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted mono xs">VERDICT</span>
            {RESIDUE_VERDICTS.map((v) => (
              <Pill
                key={v}
                active={verdict === v}
                onClick={() => attemptResidueChange(verdict, v, setResidue)}
                extra={v === 'CLEAN' ? 'tag-COWORK' : v === 'FLAGGED' ? 'tag-OPERATOR' : v === 'BLOCKED' ? 'crit' : ''}
              >
                {v}
              </Pill>
            ))}
            <span className="right mono xs muted">
              currently:{' '}
              <strong
                style={{
                  color:
                    verdict === 'CLEAN'
                      ? 'var(--green-ok)'
                      : verdict === 'BLOCKED'
                      ? 'var(--red-alert)'
                      : 'var(--gold-prime)',
                }}
              >
                {verdict}
              </strong>
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="Coverage heatmap" kicker="channels × layers · density">
        <div className="scroll-x">
          <Heatmap data={map} xLabels={LAYERS} yLabels={CHANNELS.map((c) => c.id)} />
        </div>
        <div className="muted xs mono" style={{ marginTop: 6 }}>
          density = portfolio items each channel must surface per layer · darker = denser
        </div>
      </Panel>

      <Panel title="Fusion flow" kicker="channels → normalised → fusion → matrix">
        <div className="scroll-x">
          <Sankey stages={stages} links={links} width={760} height={320} />
        </div>
        <div className="muted xs mono" style={{ marginTop: 6 }}>
          flow width = portfolio-item volume · CH-6 routes to quarantine · gap = matrix items still to populate to reach ≥80
        </div>
      </Panel>
    </div>
  );
}
