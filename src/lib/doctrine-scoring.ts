import { DOCTRINES } from '../data/doctrines';
import { readAudit } from './audit-log';
import type {
  CompositeScore,
  DoctrineClassKey,
  DoctrineScore,
  PersistedState,
} from '../data/types';

/**
 * Doctrine scoring engine — pure deterministic scoring functions.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 966-1000.
 *
 * Each scorer returns a 0..100 score, a state classification, and a
 * one-line evidence string. The thresholds (80=compliant · ≥50=partial
 * · else=violated) are the v1.3 contract — do not silently widen them.
 */

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function stateForScore(s: number): DoctrineClassKey {
  if (s >= 80) return 'compliant';
  if (s >= 50) return 'partial';
  return 'violated';
}

function d09State(s: number): DoctrineClassKey {
  // D-09 keeps the v1.3 split: ≥80 compliant, ≥40 partial, else violated.
  if (s >= 80) return 'compliant';
  if (s >= 40) return 'partial';
  return 'violated';
}

function d12State(s: number): DoctrineClassKey {
  if (s >= 80) return 'compliant';
  if (s >= 40) return 'partial';
  return 'violated';
}

export function scoreDoctrine(doctrineId: string, state: PersistedState): DoctrineScore {
  const { residueVerdict, closedODs, closedMs } = state;
  switch (doctrineId) {
    case 'D-01': {
      let s = 60;
      if (closedODs['OD-05']) s += 15;
      if (closedODs['OD-06']) s += 10;
      if (residueVerdict === 'CLEAN') s += 15;
      return { score: s, state: stateForScore(s), evidence: `announcement + AMARA + residue → ${s}` };
    }
    case 'D-02': {
      let s = 45;
      if (closedODs['OD-10']) s += 20;
      if (closedODs['OD-08']) s += 15;
      if (closedODs['OD-09']) s += 15;
      const c = clamp100(s);
      return { score: c, state: stateForScore(s), evidence: `Edna + hardware briefs → ${c}` };
    }
    case 'D-03': {
      let s = 30;
      if (closedODs['OD-04']) s += 40;
      if (residueVerdict === 'CLEAN') s += 20;
      if (closedODs['OD-03']) s += 10;
      const c = clamp100(s);
      return { score: c, state: stateForScore(s), evidence: `OD-04 + residue + nahra-v8 → ${c}` };
    }
    case 'D-04': {
      const ods = Object.values(closedODs).filter(Boolean).length;
      const s = clamp100(50 + ods * 4);
      return { score: s, state: stateForScore(s), evidence: `${ods} arbitration cycles framed and closed → ${s}` };
    }
    case 'D-05': {
      const a = readAudit().length;
      const s = clamp100(70 + Math.min(30, a * 2));
      return { score: s, state: stateForScore(s), evidence: `${a} state transitions audited → ${s}` };
    }
    case 'D-06':
      return { score: 95, state: 'compliant', evidence: 'envelope declared in lib/data-adapter contracts' };
    case 'D-07':
      return { score: 100, state: 'compliant', evidence: 'ACT · INT · CON all true for operator session' };
    case 'D-08':
      return { score: 88, state: 'compliant', evidence: '23 forms loaded · lint surfaces variants on input' };
    case 'D-09': {
      const s =
        residueVerdict === 'CLEAN' ? 100 :
        residueVerdict === 'NOT-RUN' ? 40 :
        residueVerdict === 'FLAGGED' ? 60 :
        20;
      return { score: s, state: d09State(s), evidence: `residue verdict = ${residueVerdict}` };
    }
    case 'D-10': {
      let s = 70;
      if (closedODs['OD-03']) s += 20;
      const c = clamp100(s);
      return { score: c, state: c >= 80 ? 'compliant' : 'partial', evidence: 'channel attribution + nahra-v8 status' };
    }
    case 'D-11': {
      let s = 55;
      if (closedODs['OD-01']) s += 15;
      if (closedODs['OD-02']) s += 20;
      const c = clamp100(s);
      return { score: c, state: stateForScore(s), evidence: `L0 + L1 status → ${c}` };
    }
    case 'D-12': {
      const c = Object.values(closedMs).filter(Boolean).length;
      const s = clamp100(30 + Math.round((c / 14) * 70));
      return { score: s, state: d12State(s), evidence: `${c}/14 milestones closed → ${s}` };
    }
    default:
      return { score: 50, state: 'partial', evidence: 'no scorer' };
  }
}

export function computeComposite(state: PersistedState): CompositeScore {
  const scores = DOCTRINES.map((d) => ({
    id: d.id,
    name: d.name,
    classKey: d.classKey,
    ...scoreDoctrine(d.id, state),
  }));
  const avg = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
  const compliant = scores.filter((s) => s.state === 'compliant').length;
  const violated = scores.filter((s) => s.state === 'violated').length;
  return { avg, compliant, violated, scores, total: DOCTRINES.length };
}
