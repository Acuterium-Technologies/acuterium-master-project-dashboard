'use client';

type Tab = 'matrix' | 'tasks' | 'milestones' | 'kpis';
type Props = { active: Tab; onChange: (t: Tab) => void };

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'matrix', label: 'Matrix', icon: '▦' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'milestones', label: 'Milestones', icon: '◆' },
  { id: 'kpis', label: 'KPIs', icon: '⊿' }
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#fff',
      borderTop: '1px solid var(--rule)',
      display: 'none',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100
    }} className="mobile-tab-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0',
            color: active === t.id ? 'var(--cyan)' : 'var(--muted)',
            fontWeight: active === t.id ? 700 : 500,
            transition: 'color 0.15s',
            minHeight: 56
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>{t.icon}</span>
          <span style={{ fontSize: 11, marginTop: 4 }}>{t.label}</span>
        </button>
      ))}
      <style jsx>{`
        @media (max-width: 768px) {
          nav { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
