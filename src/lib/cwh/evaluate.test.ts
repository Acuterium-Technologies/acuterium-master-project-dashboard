/**
 * Unit tests · CWH evaluator (12 rules + edge cases).
 * Phase 2 · Preflight rule 7.12 — every rule has at least one unit test.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, expect, it } from 'vitest';

import { evaluateCWH } from './evaluate';
import type { TransitionRequest } from './types';

function baseRequest(over: Partial<TransitionRequest> = {}): TransitionRequest {
  return {
    target: 'task',
    targetId: 'T-001',
    fromState: 'open',
    toState: 'done',
    actor: {
      session: 'sess_test',
      pathos: {
        stress: 40,
        focus: 60,
        curiosity: 50,
        fatigue: 30,
        satisfaction: 55,
      },
    },
    context: {
      kairosMode: 'AUI',
      doctrineScore: 75,
    },
    ...over,
  };
}

describe('evaluateCWH · 12 canonical rules', () => {
  it('CWH-R-01 · stress > 90 → deny (highest priority)', () => {
    const r = evaluateCWH(
      baseRequest({
        actor: {
          session: 's',
          pathos: { stress: 91, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-01');
    expect(r.doctrineDelta).toBeCloseTo(-1.5);
  });

  it('CWH-R-02 · fatigue > 85 + target=od → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'od',
        fromState: 'open',
        toState: 'closed',
        actor: {
          session: 's',
          pathos: { stress: 50, focus: 60, curiosity: 50, fatigue: 90, satisfaction: 60 },
        },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-02');
    expect(r.doctrineDelta).toBeCloseTo(-1.0);
  });

  it('CWH-R-03 · satisfaction < 20 + target=residue → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'residue',
        fromState: 'NOT-RUN',
        toState: 'FLAGGED',
        actor: {
          session: 's',
          pathos: { stress: 50, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 15 },
        },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-03');
    expect(r.doctrineDelta).toBeCloseTo(-0.8);
  });

  it('CWH-R-04 · task + legal transition → allow', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'task',
        fromState: 'open',
        toState: 'done',
        actor: {
          session: 's',
          pathos: { stress: 40, focus: 60, curiosity: 40, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.verdict).toBe('allow');
    expect(r.ruleId).toBe('CWH-R-04');
    expect(r.doctrineDelta).toBeCloseTo(+0.3);
  });

  it('CWH-R-05 · milestone + parent task incomplete (inc: prefix) → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'milestone',
        fromState: 'inc:T-099-incomplete',
        toState: 'closed',
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-05');
    expect(r.doctrineDelta).toBeCloseTo(-0.5);
  });

  it('CWH-R-06 · od + focus < 30 → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'od',
        fromState: 'open',
        toState: 'closed',
        actor: {
          session: 's',
          pathos: { stress: 40, focus: 22, curiosity: 50, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-06');
    expect(r.doctrineDelta).toBeCloseTo(-0.7);
  });

  it('CWH-R-07 · residue verdict already finalized (CLEAN) → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'residue',
        fromState: 'CLEAN',
        toState: 'FLAGGED',
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-07');
    expect(r.doctrineDelta).toBeCloseTo(-0.4);
  });

  it('CWH-R-07 · residue verdict already finalized (BLOCKED) → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'residue',
        fromState: 'BLOCKED',
        toState: 'CLEAN',
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-07');
  });

  it('CWH-R-08 · doctrineScore < 40 → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        context: { kairosMode: 'AUI', doctrineScore: 39 },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-08');
    expect(r.doctrineDelta).toBeCloseTo(-0.6);
  });

  it('CWH-R-09 · kairosMode=Ambient + target=od → deny', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'od',
        fromState: 'open',
        toState: 'closed',
        context: { kairosMode: 'Ambient', doctrineScore: 75 },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-09');
    expect(r.doctrineDelta).toBeCloseTo(-0.5);
  });

  it('CWH-R-10 · curiosity > 80 + target=task → allow + bonus', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'task',
        fromState: 'open',
        toState: 'done',
        actor: {
          session: 's',
          pathos: { stress: 40, focus: 60, curiosity: 82, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.verdict).toBe('allow');
    expect(r.ruleId).toBe('CWH-R-10');
    expect(r.doctrineDelta).toBeCloseTo(+0.5);
  });

  it('CWH-R-11 · stress > 85 + residue → deny (higher specificity than 03/04)', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'residue',
        fromState: 'NOT-RUN',
        toState: 'FLAGGED',
        actor: {
          session: 's',
          pathos: { stress: 86, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.verdict).toBe('deny');
    expect(r.ruleId).toBe('CWH-R-11');
    expect(r.doctrineDelta).toBeCloseTo(-1.2);
  });

  it('CWH-R-12 · default → allow', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'milestone',
        fromState: 'open',
        toState: 'closed',
      }),
    );
    expect(r.verdict).toBe('allow');
    expect(r.ruleId).toBe('CWH-R-12');
    expect(r.doctrineDelta).toBeCloseTo(+0.1);
  });
});

describe('evaluateCWH · ordering + edge cases', () => {
  it('stress=91 + target=residue fires CWH-R-01 (highest priority) NOT CWH-R-11', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'residue',
        fromState: 'NOT-RUN',
        toState: 'FLAGGED',
        actor: {
          session: 's',
          pathos: { stress: 91, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.ruleId).toBe('CWH-R-01');
  });

  it('curiosity=82 + stress=92 + target=task fires CWH-R-01 NOT CWH-R-10', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'task',
        fromState: 'open',
        toState: 'done',
        actor: {
          session: 's',
          pathos: { stress: 92, focus: 60, curiosity: 82, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.ruleId).toBe('CWH-R-01');
  });

  it('boundary · stress exactly 90 does NOT fire CWH-R-01', () => {
    const r = evaluateCWH(
      baseRequest({
        actor: {
          session: 's',
          pathos: { stress: 90, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.ruleId).not.toBe('CWH-R-01');
  });

  it('boundary · curiosity exactly 80 does NOT fire CWH-R-10 (falls to CWH-R-04)', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'task',
        fromState: 'open',
        toState: 'done',
        actor: {
          session: 's',
          pathos: { stress: 40, focus: 60, curiosity: 80, fatigue: 30, satisfaction: 55 },
        },
      }),
    );
    expect(r.ruleId).toBe('CWH-R-04');
  });

  it('task transition open→open is NOT legal — falls through to CWH-R-12', () => {
    const r = evaluateCWH(
      baseRequest({
        target: 'task',
        fromState: 'open',
        toState: 'open',
      }),
    );
    expect(r.ruleId).toBe('CWH-R-12');
  });

  it('all 12 rule IDs are reachable (smoke roll-up of the catalog)', () => {
    const reached = new Set<string>();
    reached.add(evaluateCWH(baseRequest({ actor: { session: 's', pathos: { stress: 91, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'od', fromState: 'open', toState: 'closed', actor: { session: 's', pathos: { stress: 40, focus: 60, curiosity: 50, fatigue: 90, satisfaction: 55 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'residue', fromState: 'NOT-RUN', toState: 'FLAGGED', actor: { session: 's', pathos: { stress: 50, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 15 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'task', fromState: 'open', toState: 'done' })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'milestone', fromState: 'inc:p', toState: 'closed' })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'od', fromState: 'open', toState: 'closed', actor: { session: 's', pathos: { stress: 40, focus: 20, curiosity: 50, fatigue: 30, satisfaction: 55 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'residue', fromState: 'CLEAN', toState: 'FLAGGED' })).ruleId);
    reached.add(evaluateCWH(baseRequest({ context: { kairosMode: 'AUI', doctrineScore: 30 } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'od', fromState: 'open', toState: 'closed', context: { kairosMode: 'Ambient', doctrineScore: 75 } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'task', fromState: 'open', toState: 'done', actor: { session: 's', pathos: { stress: 40, focus: 60, curiosity: 82, fatigue: 30, satisfaction: 55 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'residue', fromState: 'NOT-RUN', toState: 'FLAGGED', actor: { session: 's', pathos: { stress: 86, focus: 60, curiosity: 50, fatigue: 30, satisfaction: 55 } } })).ruleId);
    reached.add(evaluateCWH(baseRequest({ target: 'milestone', fromState: 'open', toState: 'closed' })).ruleId);
    expect(reached.size).toBe(12);
  });
});
