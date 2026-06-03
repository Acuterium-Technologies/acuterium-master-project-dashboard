/**
 * Pure task-union logic (no JSX) · Phase 5.
 *
 * Kept separate from useTasks.tsx so it can be unit-tested in a node env
 * and imported by server code without pulling in React.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { Task } from './types';

export type TasksSource = 'seed' | 'sheet';

/**
 * Union the live Sheet rows onto the seed: keep every seed task as-is, then
 * append any Sheet rows whose id the seed doesn't already carry. The Sheet can
 * only ADD tasks — never remove or rewrite a curated row.
 */
export function unionTasks(seed: Task[], live: Task[]): Task[] {
  const seedIds = new Set(seed.map((t) => t.id));
  const additions = live.filter((t) => t.id && !seedIds.has(t.id));
  return additions.length > 0 ? [...seed, ...additions] : seed;
}
