'use client';

import type { MatrixRow, Task, Milestone, Kpi } from '@/lib/seed';

type Props = {
  matrix: MatrixRow[];
  tasks: Task[];
  milestones: Milestone[];
  kpis: Kpi[];
};

export function SummaryBar({ matrix, tasks, milestones }: Props) {
  const tDone = tasks.filter(t => t.done).length;
  const mClosed = milestones.filter(m => m.closed).length;
  const ownerOpen = matrix.filter(r => r.ownerDecision && r.ownerDecision !== 'No').length;
  const critical = matrix.filter(r => /critical|stub|manus residue|prio-1/i.test(r.status)).length;
  const pct = tasks.length ? Math.round(tDone / tasks.length * 100) : 0;

  const cards = [
    { label: 'Matrix rows', value: String(matrix.length), sub: 'tracked items', color: 'var(--cyan)' },
    { label: 'Tasks complete', value: `${tDone} / ${tasks.length}`, sub: `${pct}%`, color: 'var(--gold)' },
    { label: 'Milestones closed', value: `${mClosed} / ${milestones.length}`, sub: 'state machine', color: 'var(--purple-deep)' },
    { label: 'Critical items', value: String(critical), sub: 'red flags', color: 'var(--crit-deep)' },
    { label: 'Owner decisions', value: String(ownerOpen), sub: 'awaiting Dr. Jay', color: 'var(--warn-deep)' }
  ];

  return (
    <div style={{
      display: 'grid',
      gap: 10,
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      marginBottom: 20
    }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: '#fff',
          border: '1px solid var(--rule)',
          borderLeft: `3px solid ${c.color}`,
          borderRadius: 8,
          padding: '12px 14px'
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{c.value}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
