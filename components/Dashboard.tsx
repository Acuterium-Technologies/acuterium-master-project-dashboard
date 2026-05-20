'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatrixRow, Task, Milestone, Kpi } from '@/lib/seed';
import { MatrixView } from './MatrixView';
import { TasksView } from './TasksView';
import { MilestonesView } from './MilestonesView';
import { KpisView } from './KpisView';
import { SummaryBar } from './SummaryBar';
import { Header } from './Header';
import { TabBar } from './TabBar';

type Tab = 'matrix' | 'tasks' | 'milestones' | 'kpis';

type Props = {
  initialMatrix: MatrixRow[];
  initialTasks: Task[];
  initialMilestones: Milestone[];
  initialKpis: Kpi[];
};

export function Dashboard({ initialMatrix, initialTasks, initialMilestones, initialKpis }: Props) {
  const [tab, setTab] = useState<Tab>('matrix');
  const [matrix, setMatrix] = useState(initialMatrix);
  const [tasks, setTasks] = useState(initialTasks);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [kpis, setKpis] = useState(initialKpis);
  const [, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Touch swipe for tab navigation on mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const tabs: Tab[] = ['matrix', 'tasks', 'milestones', 'kpis'];

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 80 && Math.abs(dy) < 50) {
        const idx = tabs.indexOf(tab);
        if (dx < 0 && idx < tabs.length - 1) setTab(tabs[idx + 1]);
        if (dx > 0 && idx > 0) setTab(tabs[idx - 1]);
      }
    };
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [tab]);

  // Auto-refresh data every 30 seconds from server
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/sheet', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setMatrix(data.matrix);
        setTasks(data.tasks);
        setMilestones(data.milestones);
        setKpis(data.kpis);
      } catch (e) {
        console.error('Refresh failed:', e);
      }
    };
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    startTransition(async () => {
      try {
        const res = await fetch('/api/sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'task', id, done: newDone })
        });
        if (res.ok) setSavedAt(new Date());
      } catch (e) {
        console.error('Task toggle failed:', e);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !newDone } : t));
      }
    });
  };

  const toggleMilestone = async (id: string) => {
    const m = milestones.find(x => x.id === id);
    if (!m) return;
    const newClosed = !m.closed;
    setMilestones(prev => prev.map(x => x.id === id ? { ...x, closed: newClosed } : x));
    startTransition(async () => {
      try {
        const res = await fetch('/api/sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'milestone', id, closed: newClosed })
        });
        if (res.ok) setSavedAt(new Date());
      } catch (e) {
        console.error('Milestone toggle failed:', e);
        setMilestones(prev => prev.map(x => x.id === id ? { ...x, closed: !newClosed } : x));
      }
    });
  };

  const editKpi = async (id: string, value: string) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, value } : k));
    startTransition(async () => {
      try {
        const res = await fetch('/api/sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'kpi', id, value })
        });
        if (res.ok) setSavedAt(new Date());
      } catch (e) {
        console.error('KPI edit failed:', e);
      }
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 100px' }}>
      <Header savedAt={savedAt} />
      <SummaryBar matrix={matrix} tasks={tasks} milestones={milestones} kpis={kpis} />

      {/* Desktop top tabs */}
      <div className="desktop-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--rule)', paddingBottom: 8 }}>
        <DesktopTab active={tab === 'matrix'} onClick={() => setTab('matrix')} label="Matrix" count={matrix.length} />
        <DesktopTab active={tab === 'tasks'} onClick={() => setTab('tasks')} label="Tasks" count={tasks.length} />
        <DesktopTab active={tab === 'milestones'} onClick={() => setTab('milestones')} label="Milestones" count={milestones.length} />
        <DesktopTab active={tab === 'kpis'} onClick={() => setTab('kpis')} label="KPIs" count={kpis.length} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'matrix' && <MatrixView rows={matrix} />}
          {tab === 'tasks' && <TasksView tasks={tasks} onToggle={toggleTask} />}
          {tab === 'milestones' && <MilestonesView milestones={milestones} onToggle={toggleMilestone} />}
          {tab === 'kpis' && <KpisView kpis={kpis} onEdit={editKpi} />}
        </motion.div>
      </AnimatePresence>

      <footer style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid var(--rule)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Acuterium Technologies Inc. · Muscat, Sultanate of Oman<br />
        ACUTERIUM-INTERNAL · SOVEREIGN · master-project.acuterium.ai
      </footer>

      {/* Mobile bottom tab bar */}
      <TabBar active={tab} onChange={setTab} />

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function DesktopTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? '#fff' : 'var(--slate)',
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.15s'
      }}
    >
      {label}
      <span style={{
        background: active ? 'rgba(255,255,255,0.2)' : 'var(--panel)',
        color: active ? '#fff' : 'var(--muted)',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600
      }}>{count}</span>
    </button>
  );
}
