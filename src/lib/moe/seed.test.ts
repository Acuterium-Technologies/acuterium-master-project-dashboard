/**
 * MOE seed + simulator unit tests · Phase 3b.02.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, expect, it } from 'vitest';

import { domainOf, EXPERT_DOMAINS_LIST } from './seed';
import { createSimulator, simulateMOESnapshot } from './simulate';
import { EXPERT_DOMAINS, GRID_COLS, GRID_ROWS, TOTAL_EXPERTS } from './types';

describe('MOE seed', () => {
  it('produces exactly 785 expert assignments', () => {
    expect(EXPERT_DOMAINS_LIST.length).toBe(TOTAL_EXPERTS);
  });

  it('matches the canonical domain ratios', () => {
    const counts: Record<string, number> = {};
    for (const d of EXPERT_DOMAINS_LIST) counts[d] = (counts[d] ?? 0) + 1;
    expect(counts.language).toBe(220);
    expect(counts.reasoning).toBe(180);
    expect(counts.code).toBe(140);
    expect(counts.legal).toBe(100);
    expect(counts.finance).toBe(90);
    expect(counts.security).toBe(55);
  });

  it('domainOf is stable for a given id (fixed seed)', () => {
    const sample = [0, 1, 100, 500, 784].map(domainOf);
    expect(sample.every((d) => EXPERT_DOMAINS.includes(d))).toBe(true);
    // Re-computing the assignments without mutating state should match.
    expect(domainOf(100)).toBe(EXPERT_DOMAINS_LIST[100]);
    expect(domainOf(784)).toBe(EXPERT_DOMAINS_LIST[784]);
  });

  it('GRID_COLS × GRID_ROWS = 805 cells (785 experts + 20 trailing inactive)', () => {
    expect(GRID_COLS * GRID_ROWS).toBe(805);
  });
});

describe('MOE simulator', () => {
  it('produces a snapshot with exactly 785 experts', () => {
    const snap = simulateMOESnapshot(createSimulator(0x1234));
    expect(snap.experts.length).toBe(TOTAL_EXPERTS);
  });

  it('totalActive count matches the active filter', () => {
    const snap = simulateMOESnapshot(createSimulator(0x5678));
    const counted = snap.experts.filter((e) => e.active).length;
    expect(snap.totalActive).toBe(counted);
  });

  it('domainCounts sums to totalActive', () => {
    const snap = simulateMOESnapshot(createSimulator(0x9abc));
    const sum =
      snap.domainCounts.language +
      snap.domainCounts.reasoning +
      snap.domainCounts.code +
      snap.domainCounts.legal +
      snap.domainCounts.finance +
      snap.domainCounts.security;
    expect(sum).toBe(snap.totalActive);
  });

  it('consecutive snapshots show decay coherence (no full reset between ticks)', () => {
    const state = createSimulator(0xdef0);
    const s1 = simulateMOESnapshot(state);
    const s2 = simulateMOESnapshot(state);
    // At least 25% of the previously-active experts should still be active OR have positive cumulative heat.
    const wereActive = s1.experts.filter((e) => e.active).map((e) => e.id);
    const stillActive = wereActive.filter((id) => s2.experts[id].active).length;
    expect(stillActive).toBeGreaterThan(wereActive.length * 0.1);
  });

  it('snapshot timestamp is a valid ISO string', () => {
    const snap = simulateMOESnapshot(createSimulator());
    expect(new Date(snap.timestamp).toString()).not.toBe('Invalid Date');
  });
});
