'use client';

import { useState } from 'react';
import type { MatrixRow } from '@/lib/seed';

const statusBorder = (s: string) => {
  const sl = s.toLowerCase();
  if (/critical|stub|manus residue|prio-1/.test(sl)) return 'var(--crit-deep)';
  if (/unannounced|pending|in-flight|concept|stopgap/.test(sl)) return 'var(--warn-deep)';
  if (/canonical|production|shipped|operational|deployed/.test(sl)) return 'var(--ok-deep)';
  return 'var(--muted)';
};

const confBg = (c: string) => c === 'HIGH' ? 'var(--ok)' : c === 'MEDIUM' ? 'var(--warn)' : 'var(--crit)';
const confColor = (c: string) => c === 'HIGH' ? '#085041' : c === 'MEDIUM' ? '#854F0B' : '#791F1F';

export function MatrixView({ rows }: { rows: MatrixRow[] }) {
  const [filter, setFilter] = useState('all');

  const filtered = rows.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'critical') return /critical|stub|manus residue|prio-1/i.test(r.status);
    if (filter === 'unannounced') return /unannounced|stopgap/i.test(r.status);
    if (filter === 'sovereign') return r.sensitivity === 'Sovereign';
    if (filter === 'hardware') return r.product?.includes('Hardware');
    return true;
  });

  const filters: [string, string][] = [
    ['all', 'All'],
    ['critical', 'Critical/stub'],
    ['unannounced', 'Unannounced'],
    ['sovereign', 'Sovereign'],
    ['hardware', 'Hardware']
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: '6px 14px',
              border: `1px solid ${filter === k ? 'var(--cyan)' : 'var(--rule)'}`,
              background: filter === k ? 'rgba(0,168,154,0.1)' : '#fff',
              color: filter === k ? 'var(--cyan)' : 'var(--slate)',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {l}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{
            background: '#fff',
            border: '1px solid var(--rule)',
            borderLeft: `4px solid ${statusBorder(r.status)}`,
            borderRadius: 10,
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{r.id}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{r.product}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Pill bg="var(--panel)" color="var(--ink)">{r.layer}</Pill>
                <Pill bg={confBg(r.confidence)} color={confColor(r.confidence)}>{r.confidence}</Pill>
                <Pill bg={r.sensitivity === 'Sovereign' ? 'var(--warn)' : 'var(--panel)'} color={r.sensitivity === 'Sovereign' ? 'var(--gold)' : 'var(--muted)'}>{r.sensitivity}</Pill>
              </div>
            </div>
            <div style={{ fontSize: 12, color: statusBorder(r.status), fontWeight: 600, marginBottom: 6 }}>
              ● {r.status}
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Action:</span> {r.action}
            </div>
            {r.ownerDecision && r.ownerDecision !== 'No' && (
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>
                ⚠ Owner decision: {r.ownerDecision}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      background: bg,
      color,
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      display: 'inline-block'
    }}>
      {children}
    </span>
  );
}
