/**
 * TELOS · intent oracle.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2658-2713 (verbatim port).
 *
 * Returns the TOP 4 predictions sorted DESCENDING by confidence — order
 * is LOAD-BEARING per the v1.4 doctrinal red lines. Each prediction has
 * a structured action target:
 *   – section id ('channels' · 'decisions' · 'campaign' · …) → navigate
 *   – '_mode:hud' / '_mode:ambient' → suggest a KAIROS mode switch
 *
 * Sources include: CH-6 quarantine verdict, OD-04 RUZN.AI residue
 * post-mortem, Phase 0 pre-flight progress, Phase 1 channel dispatch
 * progress, PATHOS stress > 70, NEXUS idle > 120s, and the Phase 3 Day-14
 * Sprint S2 charter signature gate.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import { TASKS } from '../data';
import type { PersistedState } from '../data/types';
import type { KairosMode, NexusSignals, PathosState, TelosPrediction } from './types';

export type ComputeTelosArgs = {
  persisted: PersistedState;
  mode: KairosMode;
  pathos: PathosState;
  nexus: NexusSignals;
};

export function computeTELOS({
  persisted,
  mode,
  pathos,
  nexus,
}: ComputeTelosArgs): TelosPrediction[] {
  const out: TelosPrediction[] = [];

  if (persisted.residueVerdict === 'NOT-RUN') {
    out.push({
      id: 'TELOS-01',
      source: 'CH-6 quarantine',
      title: 'Run CH-6 security-auditor residue scan',
      reason: 'Manus quarantine verdict = NOT-RUN · blocks fusion intake · Golden Rule #4',
      conf: 92,
      action: 'channels',
    });
  } else if (persisted.residueVerdict === 'BLOCKED') {
    out.push({
      id: 'TELOS-01',
      source: 'CH-6 quarantine',
      title: 'Arbitrate CH-6 with Dr. Jay (BLOCKED verdict)',
      reason:
        'Quarantine verdict BLOCKED · CH-6 fusion release requires owner sign-off',
      conf: 88,
      action: 'decisions',
    });
  }

  if (!persisted.closedODs['OD-04']) {
    out.push({
      id: 'TELOS-02',
      source: 'OD-04',
      title: 'Close OD-04 · RUZN.AI Manus residue post-mortem',
      reason: 'PRIO-1 owner decision · blocks all further RUZN.AI work',
      conf: 86,
      action: 'decisions',
    });
  }

  const p0 = TASKS.filter((t) => t.phase === 0);
  const p0d = p0.filter((t) => persisted.done[t.id]).length;
  if (p0d < p0.length) {
    out.push({
      id: 'TELOS-03',
      source: 'Phase 0',
      title: `Complete Phase 0 pre-flight (${p0d}/${p0.length})`,
      reason: 'Phase 0 closure is prerequisite for channel dispatch (M-00)',
      conf: 78,
      action: 'campaign',
    });
  }

  const p1ChannelTasks = TASKS.filter((t) => t.phase === 1 && /Dispatch/i.test(t.title));
  const p1ChannelDone = p1ChannelTasks.filter((t) => persisted.done[t.id]).length;
  if (p0d === p0.length && p1ChannelDone < p1ChannelTasks.length) {
    out.push({
      id: 'TELOS-04',
      source: 'Phase 1',
      title: `Dispatch next channel (${p1ChannelDone}/${p1ChannelTasks.length} sent)`,
      reason:
        'Phase 0 complete · next operator action is CH-1 → CH-6 dispatch sequence',
      conf: 74,
      action: 'channels',
    });
  }

  if (pathos.stress > 70 && mode !== 'hud') {
    out.push({
      id: 'TELOS-05',
      source: 'PATHOS · stress',
      title: 'Switch to HUD mode for intel-density view',
      reason: `Stress at ${pathos.stress} · monochrome HUD reduces visual load`,
      conf: 62,
      action: '_mode:hud',
    });
  }

  if (nexus.idleSeconds > 120 && mode !== 'ambient') {
    out.push({
      id: 'TELOS-06',
      source: 'NEXUS · idle',
      title: 'Drop to Ambient (organism) mode',
      reason: `Idle ${nexus.idleSeconds}s · ambient is the calm-room when nothing pressing remains`,
      conf: 55,
      action: '_mode:ambient',
    });
  }

  const arbDone = ['T3-D8-02', 'T3-D9-01', 'T3-D9-02', 'T3-D10-01'].every(
    (id) => persisted.done[id],
  );
  if (arbDone && !persisted.done['T3-D14-01']) {
    out.push({
      id: 'TELOS-08',
      source: 'Phase 3 Day 14',
      title: 'Sign Sprint S2 charter (v0.3.0)',
      reason:
        'Arbitration cycle complete · next sovereign action is charter signature',
      conf: 60,
      action: 'campaign',
    });
  }

  return out.sort((a, b) => b.conf - a.conf).slice(0, 4);
}
