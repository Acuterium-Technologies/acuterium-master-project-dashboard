/**
 * CWH (Consciousness Welfare & Harmony) gate · client mirror.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1002-1040.
 *
 * Doctrine D-05 codifies the ethical interception layer. Two hard rules
 * carry over from v1.3, both enforced in front of every state transition
 * the React layer attempts:
 *
 *   Rule 1 — residue transitions: NOT-RUN → CLEAN is forbidden.
 *            The verdict must transit FLAGGED or BLOCKED first so that
 *            a CH-6 security-auditor review is part of the chain.
 *
 *   Rule 2 — OD-04 (RUZN.AI Manus post-mortem) cannot close while the
 *            residue verdict is BLOCKED. Closure is conditioned on the
 *            quarantine status, not on operator preference.
 *
 * In v1.4 this file is the client mirror; in v1.5 (Phase 2) the same
 * predicate runs server-side at `/api/cwh/transition` and the client
 * call becomes a `fetch` proxy. Keeping the function signature stable
 * means callers don't need to be touched again.
 *
 * Side effects:
 *   - Every call appends to the AuditLog (allowed + denied alike).
 *   - When `toast` is supplied, the gate fires a green ✓ / red ⛔ toast.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { appendAudit } from './audit-log';
import type { PersistedState, ResidueVerdict } from '../data/types';

export type CWHTransitionKind = 'task' | 'milestone' | 'OD' | 'residue';

export type CWHTransition = {
  kind: CWHTransitionKind;
  id: string;
  before?: string | boolean | null;
  after?: string | boolean | null;
  persistedState?: PersistedState;
};

export type CWHGateResult = {
  allow: boolean;
  reason?: string;
  doctrine?: 'D-05';
};

export type CWHToast = (msg: string, deny: boolean) => void;

function stringify(v: CWHTransition['before'] | CWHTransition['after']): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'closed' : 'open';
  return v;
}

export function cwhGate(transition: CWHTransition, toast?: CWHToast): CWHGateResult {
  const { kind, id, before, after, persistedState } = transition;
  const beforeS = stringify(before);
  const afterS = stringify(after);

  // Rule 1: residue NOT-RUN → CLEAN forbidden
  if (kind === 'residue' && beforeS === 'NOT-RUN' && afterS === 'CLEAN') {
    const reason = 'residue must be reviewed before CLEAN — set FLAGGED or BLOCKED first';
    appendAudit({
      actor: 'operator',
      action: 'residue_attempt_denied',
      resource: 'CH-6',
      before: beforeS,
      after: afterS,
      reason: 'NOT-RUN→CLEAN forbidden',
    });
    toast?.(reason, true);
    return { allow: false, reason, doctrine: 'D-05' };
  }

  // Rule 2: OD-04 close blocked while residue = BLOCKED
  if (kind === 'OD' && id === 'OD-04' && !before && persistedState?.residueVerdict === 'BLOCKED') {
    const reason = 'OD-04 blocked while CH-6 residue = BLOCKED';
    appendAudit({
      actor: 'operator',
      action: 'OD_close_denied',
      resource: id,
      reason: 'residue BLOCKED',
    });
    toast?.(reason, true);
    return { allow: false, reason, doctrine: 'D-05' };
  }

  // Allowed transition · audit + green toast
  appendAudit({
    actor: 'operator',
    action: `${kind}_toggle`,
    resource: id,
    before: beforeS,
    after: afterS,
  });
  toast?.(`${kind} · ${id} · ${afterS || 'toggled'}`, false);
  return { allow: true };
}

export const RESIDUE_VERDICTS: ResidueVerdict[] = ['NOT-RUN', 'FLAGGED', 'BLOCKED', 'CLEAN'];
