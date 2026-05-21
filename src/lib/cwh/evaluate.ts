/**
 * CWH evaluator · 12 canonical rules.
 * Phase 2 · single source of truth for client preview + server enforcement.
 *
 * Rules evaluated IN ORDER, first match wins. IDs CWH-R-01..CWH-R-12 are
 * LOCKED per ACU-DISPATCH-SCHEMA v1.1 — do not renumber.
 *
 *   CWH-R-01 · stress > 90              → deny  · Δ −1.5
 *   CWH-R-02 · fatigue > 85 + od        → deny  · Δ −1.0
 *   CWH-R-03 · satisfaction < 20 + res  → deny  · Δ −0.8
 *   CWH-R-04 · task + legal transition  → allow · Δ +0.3
 *   CWH-R-05 · milestone + parent inc.  → deny  · Δ −0.5
 *   CWH-R-06 · od + focus < 30          → deny  · Δ −0.7
 *   CWH-R-07 · res + verdict finalized  → deny  · Δ −0.4
 *   CWH-R-08 · doctrineScore < 40       → deny  · Δ −0.6
 *   CWH-R-09 · Ambient + od             → deny  · Δ −0.5
 *   CWH-R-10 · curiosity > 80 + task    → allow · Δ +0.5
 *   CWH-R-11 · stress > 85 + residue    → deny  · Δ −1.2
 *   CWH-R-12 · default                  → allow · Δ +0.1
 *
 * Pure functions — no IO, no logging, no time. The route handler adds the
 * auditId + timestamp + persists the audit entry; the client hook adds an
 * optimistic preview. Both call evaluateCWH(input) and the verdict must
 * be identical (Preflight rule 7.15).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import type { EvaluatorResult, TransitionRequest } from './types';

/** Terminal residue verdicts — Rule CWH-R-07 fires when fromState is one. */
const FINALIZED_RESIDUE_STATES = new Set(['CLEAN', 'BLOCKED']);

/**
 * Legal task transition check (Rule CWH-R-04).
 *
 * Tasks have a simple two-state lifecycle: 'open' ↔ 'done'. Anything else
 * is rejected by the schema layer (Zod min(1) only); semantically here we
 * accept only the two known states. A task may NOT transition open→open
 * or done→done (no-ops are silently a Rule CWH-R-12 allow elsewhere, but
 * for the explicit Rule CWH-R-04 we require an actual flip).
 */
function isLegalTaskTransition(fromState: string, toState: string): boolean {
  const a = fromState.toLowerCase();
  const b = toState.toLowerCase();
  if (a === b) return false;
  const known = new Set(['open', 'done', 'closed']);
  return known.has(a) && known.has(b);
}

/**
 * Heuristic for Rule CWH-R-05 · parent task incomplete.
 *
 * The evaluator has no live database — milestone completeness is
 * communicated via fromState. A milestone whose fromState starts with
 * "inc:" carries the marker "incomplete prerequisite". Callers (route +
 * client preview) MUST set this marker when any prerequisite task is
 * still open; otherwise the rule cannot fire and Rule CWH-R-12 (default
 * allow) is the verdict.
 *
 * This keeps the evaluator pure while letting both sites (server route
 * and client preview hook) share the same predicate.
 */
function milestoneParentIncomplete(fromState: string): boolean {
  return fromState.toLowerCase().startsWith('inc:');
}

/**
 * Pure evaluator. Returns the FIRST matching rule's verdict.
 */
export function evaluateCWH(input: TransitionRequest): EvaluatorResult {
  const { target, fromState, toState, actor, context } = input;
  const { stress, focus, curiosity, fatigue, satisfaction } = actor.pathos;
  const { kairosMode, doctrineScore } = context;

  // CWH-R-01 · stress > 90 → deny.
  if (stress > 90) {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-01',
      doctrineDelta: -1.5,
      reason: `stress ${stress} > 90 — operator welfare guard tripped`,
    };
  }

  // CWH-R-02 · fatigue > 85 + target=od → deny.
  if (fatigue > 85 && target === 'od') {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-02',
      doctrineDelta: -1.0,
      reason: `fatigue ${fatigue} > 85 with target=od — defer owner decisions`,
    };
  }

  // CWH-R-03 · satisfaction < 20 + target=residue → deny.
  if (satisfaction < 20 && target === 'residue') {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-03',
      doctrineDelta: -0.8,
      reason: `satisfaction ${satisfaction} < 20 with target=residue — review state first`,
    };
  }

  // CWH-R-11 · stress > 85 + target=residue → deny (higher specificity than 04).
  if (stress > 85 && target === 'residue') {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-11',
      doctrineDelta: -1.2,
      reason: `stress ${stress} > 85 + target=residue → ethical guard tripped`,
    };
  }

  // CWH-R-07 · target=residue + verdict already finalized → deny.
  if (target === 'residue' && FINALIZED_RESIDUE_STATES.has(fromState.toUpperCase())) {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-07',
      doctrineDelta: -0.4,
      reason: `residue verdict ${fromState.toUpperCase()} is terminal — cannot transition`,
    };
  }

  // CWH-R-08 · doctrineScore < 40 + any target → deny.
  if (doctrineScore < 40) {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-08',
      doctrineDelta: -0.6,
      reason: `doctrineScore ${doctrineScore} < 40 — stabilise compliance before further transitions`,
    };
  }

  // CWH-R-09 · kairosMode=Ambient + target=od → deny.
  if (kairosMode === 'Ambient' && target === 'od') {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-09',
      doctrineDelta: -0.5,
      reason: 'Ambient mode is reflective — exit before closing owner decisions',
    };
  }

  // CWH-R-05 · target=milestone + parent task incomplete → deny.
  if (target === 'milestone' && milestoneParentIncomplete(fromState)) {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-05',
      doctrineDelta: -0.5,
      reason: 'milestone parent task still incomplete',
    };
  }

  // CWH-R-06 · target=od + focus < 30 → deny.
  if (target === 'od' && focus < 30) {
    return {
      verdict: 'deny',
      ruleId: 'CWH-R-06',
      doctrineDelta: -0.7,
      reason: `focus ${focus} < 30 with target=od — return when steady`,
    };
  }

  // CWH-R-10 · curiosity > 80 + target=task → allow + bonus.
  if (curiosity > 80 && target === 'task') {
    return {
      verdict: 'allow',
      ruleId: 'CWH-R-10',
      doctrineDelta: +0.5,
      reason: `curiosity ${curiosity} > 80 — exploration bonus granted`,
    };
  }

  // CWH-R-04 · target=task + legal transition → allow.
  if (target === 'task' && isLegalTaskTransition(fromState, toState)) {
    return {
      verdict: 'allow',
      ruleId: 'CWH-R-04',
      doctrineDelta: +0.3,
      reason: 'legal task transition',
    };
  }

  // CWH-R-12 · default → allow.
  return {
    verdict: 'allow',
    ruleId: 'CWH-R-12',
    doctrineDelta: +0.1,
  };
}
