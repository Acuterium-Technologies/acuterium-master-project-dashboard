'use client';

import { useState } from 'react';
import type { Task } from '@/lib/seed';

const catColor = (c: string) => c === 'COWORK' ? 'var(--cyan)' : c === 'OPERATOR' ? 'var(--gold)' : 'var(--purple-deep)';
const catBg = (c: string) => c === 'COWORK' ? 'rgba(0,168,154,0.15)' : c === 'OPERATOR' ? 'rgba(184,134,11,0.15)' : 'var(--purple-light)';

export function TasksView({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const phaseLabels = ['Phase 0 — Pre-flight', 'Phase 1 — Dispatch', 'Phase 2 — Fusion', 'Phase 3 — Exploitation'];
  const phaseTasks = tasks.filter(t => t.phase === phase);
  const done = phaseTasks.filter(t => t.done).length;
  const pct = phaseTasks.length ? Math.round(done / phaseTasks.length * 100) : 0;

  const byDay: Record<number, Task[]> = {};
  phaseTasks.forEach(t => {
    if (!byDay[t.day]) byDay[t.day] = [];
    byDay[t.day].push(t);
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map(p => {
          const pT = tasks.filter(t => t.phase === p);
          const pD = pT.filter(t => t.done).length;
          return (
            <button
              key={p}
              onClick={() => setPhase(p as 0|1|2|3)}
              style={{
                padding: '8px 14px',
                border: `1px solid ${phase === p ? 'var(--cyan)' : 'var(--rule)'}`,
                background: phase === p ? 'rgba(0,168,154,0.1)' : '#fff',
                color: phase === p ? 'var(--cyan)' : 'var(--slate)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2
              }}
            >
              <span>Phase {p}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{pD}/{pT.length}</span>
            </button>
          );
        })}
      </div>

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
          <div style={{ fontSize: 13, color: 'var(--slate)' }}>{phaseLabels[phase]}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{done} of {phaseTasks.length} complete</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>{pct}%</div>
      </div>

      {Object.keys(byDay).sort((a, b) => Number(a) - Number(b)).map(d => (
        <div key={d} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--cyan)',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid var(--rule)'
          }}>
            Day {d}
          </div>
          {byDay[Number(d)].map(t => (
            <div
              key={t.id}
              onClick={() => onToggle(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                background: t.done ? 'rgba(212,244,221,0.5)' : '#fff',
                border: '1px solid var(--rule)',
                borderRadius: 8,
                marginBottom: 6,
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${t.done ? 'var(--ok-deep)' : 'var(--rule)'}`,
                background: t.done ? 'var(--ok-deep)' : '#fff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0
              }}>
                {t.done ? '✓' : ''}
              </div>
              <span style={{
                background: catBg(t.cat),
                color: catColor(t.cat),
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0
              }}>
                {t.cat}
              </span>
              <div style={{
                flex: 1,
                fontSize: 13,
                color: t.done ? 'var(--muted)' : 'var(--ink)',
                textDecoration: t.done ? 'line-through' : 'none'
              }}>
                {t.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                {t.id}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
