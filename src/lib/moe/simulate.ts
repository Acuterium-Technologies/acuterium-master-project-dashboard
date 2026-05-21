/**
 * MOE activation simulator · Phase 3b.02.
 *
 * Produces coherent-looking activation snapshots until real DIARAN-MOE
 * telemetry wires up (Phase 4+). NOT pure noise: each tick decays the
 * previous activation while sampling a target population of ~120-180
 * experts (real MOE-Heavy activates ~150 of 785 per token).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { domainOf } from './seed';
import {
  EXPERT_DOMAINS,
  TOTAL_EXPERTS,
  type ExpertDomain,
  type ExpertNode,
  type MOESnapshot,
} from './types';

// 32-bit LCG so consecutive snapshots are deterministic from a starting seed
// AND look like inference (low jump magnitude between ticks).
type SimulatorState = {
  seed: number;
  cumulative: number[];
};

function createSimulator(seed: number = 0xace7e40): SimulatorState {
  return {
    seed: seed >>> 0,
    cumulative: new Array(TOTAL_EXPERTS).fill(0),
  };
}

function nextRandom(state: SimulatorState): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 0xffffffff;
}

export function simulateMOESnapshot(state?: SimulatorState): MOESnapshot {
  const s = state ?? defaultState;
  const targetActive = 120 + Math.floor(nextRandom(s) * 60);

  const experts: ExpertNode[] = new Array(TOTAL_EXPERTS);
  for (let i = 0; i < TOTAL_EXPERTS; i++) {
    const r = nextRandom(s);
    const heat = s.cumulative[i];
    const active = heat * 0.5 + r < (targetActive / TOTAL_EXPERTS) * 1.8;
    const activationStrength = active ? 0.3 + nextRandom(s) * 0.7 : 0;
    s.cumulative[i] = active ? heat * 0.7 + 0.3 : heat * 0.5;
    experts[i] = {
      id: i,
      domain: domainOf(i),
      layer: i % 8,
      active,
      activationStrength,
    };
  }

  const domainCounts: Record<ExpertDomain, number> = {
    language: 0,
    reasoning: 0,
    code: 0,
    legal: 0,
    finance: 0,
    security: 0,
  };
  let totalActive = 0;
  for (const e of experts) {
    if (e.active) {
      totalActive++;
      domainCounts[e.domain]++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    experts,
    totalActive,
    domainCounts,
  };
}

const defaultState: SimulatorState = createSimulator();

// Exposed so vitest can build isolated state and the SSE route can re-seed
// on cold-start without dragging the default state around.
export { createSimulator, EXPERT_DOMAINS, TOTAL_EXPERTS };
