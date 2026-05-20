'use client';

import type { Milestone } from '@/lib/seed';

export function MilestonesView({ milestones, onToggle }: { milestones: Milestone[]; onToggle: (id: string) => void }) {
  const closed = milestones.filter(m => m.closed).length;
  const pct = milestones.length ? Math.round(closed / milestones.length * 100) : 0;

  return (
    <div>
      <div style={{
        background: 'var(--panel)',
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--slate)' }}>Campaign state machine</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{closed} of {milestones.length} milestones closed</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>{pct}%</div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{
          position: 'absolute',
          left: 11,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'var(--rule)'
        }} />
        {milestones.map(m => (
          <div key={m.id} style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{
              position: 'absolute',
              left: -22,
              top: 8,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: m.closed ? 'var(--ok-deep)' : '#fff',
              border: `3px solid ${m.closed ? 'var(--ok-deep)' : 'var(--rule)'}`,
              zIndex: 2
            }} />
            <div
              onClick={() => onToggle(m.id)}
              style={{
                background: m.closed ? 'rgba(212,244,221,0.4)' : '#fff',
                border: `1px solid ${m.closed ? 'var(--ok-deep)' : 'var(--rule)'}`,
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: m.closed ? 'var(--ok-deep)' : 'var(--ink)',
                    fontSize: 13
                  }}>
                    {m.id}
                  </span>
                  <span style={{
                    background: 'var(--panel)',
                    color: 'var(--muted)',
                    padding: '2px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    Day {m.day}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: m.closed ? 'var(--ok-deep)' : 'var(--muted)', fontWeight: 600 }}>
                  {m.closed ? '✓ CLOSED' : '○ OPEN'}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>{m.criterion}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
