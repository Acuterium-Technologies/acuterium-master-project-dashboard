/**
 * Live task source · Phase 5 (Platform & Observability).
 *
 * The Master Ops task LIST has historically been the committed seed
 * (src/data/tasks.ts). This provider makes it LIVE: on mount it fetches the
 * Google Sheet's Tasks tab via the existing cookie-gated read API and UNIONs
 * the result with the seed — so new rows added to the Sheet appear on the
 * dashboard without a code change.
 *
 * Design rules (deliberately conservative — the Sheet has historically held
 * FEWER rows than the curated seed, so we never let it shrink the list):
 *   · seed is the authoritative baseline — every curated task always renders.
 *   · the Sheet can only ADD tasks (ids not present in the seed), never remove
 *     or rewrite a curated row's metadata.
 *   · done-state is unchanged — it still lives in usePersistedState
 *     (localStorage + CWH write-back), keyed by task id.
 *   · offline / unconfigured / 401 / 503 → silently fall back to seed.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { TASKS as SEED_TASKS } from './tasks';
import { unionTasks, type TasksSource } from './task-union';
import type { Task } from './types';

export type { TasksSource };

export type TasksContextValue = {
  tasks: Task[];
  source: TasksSource;
  loading: boolean;
};

const DEFAULT: TasksContextValue = {
  tasks: SEED_TASKS,
  source: 'seed',
  loading: false,
};

const TasksContext = createContext<TasksContextValue>(DEFAULT);

export { unionTasks };

export function TasksProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TasksContextValue>({
    tasks: SEED_TASKS,
    source: 'seed',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/sheets/read?tab=tasks', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: { data?: Task[] }) => {
        if (cancelled) return;
        const live = Array.isArray(json?.data) ? json.data : [];
        if (live.length > 0) {
          setValue({ tasks: unionTasks(SEED_TASKS, live), source: 'sheet', loading: false });
        } else {
          setValue({ tasks: SEED_TASKS, source: 'seed', loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) setValue({ tasks: SEED_TASKS, source: 'seed', loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

/** The live-or-seed task array (safe outside a provider → returns the seed). */
export function useTasks(): Task[] {
  return useContext(TasksContext).tasks;
}

/** Source + loading metadata, for an optional "live sheet / seed" badge. */
export function useTasksMeta(): TasksContextValue {
  return useContext(TasksContext);
}
