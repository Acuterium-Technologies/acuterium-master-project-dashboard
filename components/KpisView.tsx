'use client';

import { useState } from 'react';
import type { Kpi } from '@/lib/seed';

export function KpisView({ kpis, onEdit }: { kpis: Kpi[]; onEdit: (id: string, value: string) => void }) {
  return (
    <div>
      {[0, 1, 2, 3].map(p => {
        const phaseKpis = kpis.filter(k => k.phase === p);
        if (phaseKpis.length === 0) return null;
        return (
          <div key={p} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--cyan)',
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--rule)'
            }}>
              Phase {p} KPIs
            </div>
            <div style={{
              display: 'grid',
              gap: 10,
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
              {phaseKpis.map(k => <KpiCard key={k.id} kpi={k} onEdit={onEdit} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ kpi, onEdit }: { kpi: Kpi; onEdit: (id: string, value: string) => void }) {
  const [val, setVal] = useState(kpi.value);
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      padding: 14
    }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 4 }}>{kpi.id}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 12, minHeight: 36, lineHeight: 1.4 }}>
        {kpi.name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Current</div>
          <input
            type="text"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => { if (val !== kpi.value) onEdit(kpi.id, val); }}
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              border: 'none',
              borderBottom: '1px dashed var(--rule)',
              padding: '2px 0',
              width: '100%',
              maxWidth: 140,
              background: 'transparent'
            }}
          />
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Target</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cyan)' }}>{kpi.target}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 6, borderTop: '1px solid var(--rule)' }}>
        Source: {kpi.source}
      </div>
    </div>
  );
}
