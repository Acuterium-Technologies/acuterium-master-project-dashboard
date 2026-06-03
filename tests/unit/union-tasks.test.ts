/**
 * Live-sheet task union · unit tests (Phase 5).
 *
 * unionTasks must never shrink or rewrite the curated seed — it may only
 * APPEND Sheet rows whose id the seed doesn't already carry.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, it, expect } from 'vitest';

import { unionTasks } from '../../src/data/task-union';
import type { Task } from '../../src/data/types';

const seed: Task[] = [
  { id: 'A-1', phase: 0, day: 0, cat: 'OPERATOR', title: 'seed one', done: true },
  { id: 'A-2', phase: 1, day: 1, cat: 'COWORK', title: 'seed two' },
];

describe('unionTasks', () => {
  it('appends Sheet-only rows the seed does not have', () => {
    const live: Task[] = [{ id: 'NEW-1', phase: 5, day: 9, cat: 'CLAUDE', title: 'live add' }];
    const out = unionTasks(seed, live);
    expect(out).toHaveLength(3);
    expect(out.map((t) => t.id)).toContain('NEW-1');
  });

  it('never lets the Sheet rewrite or shrink a curated row', () => {
    // Sheet returns a tampered A-1 (wrong title/phase) + fewer rows than seed.
    const live: Task[] = [{ id: 'A-1', phase: 9, day: 9, cat: 'CLAUDE', title: 'TAMPERED' }];
    const out = unionTasks(seed, live);
    expect(out).toHaveLength(2); // both seed rows survive, no addition
    const a1 = out.find((t) => t.id === 'A-1')!;
    expect(a1.title).toBe('seed one'); // seed wins
    expect(a1.phase).toBe(0);
    expect(a1.done).toBe(true);
  });

  it('returns the seed array unchanged when there are no additions', () => {
    expect(unionTasks(seed, [])).toBe(seed);
  });

  it('ignores live rows with an empty id', () => {
    const live = [{ id: '', phase: 2, day: 2, cat: 'CLAUDE', title: 'noid' }] as Task[];
    expect(unionTasks(seed, live)).toHaveLength(2);
  });
});
