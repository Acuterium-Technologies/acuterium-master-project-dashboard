/**
 * CWH (Consciousness Welfare & Harmony) gate · shared type contracts.
 * Phase 2 · ACU-DISPATCH-SCHEMA v1.1 · ACU-NAMING-CANON v1.0.
 *
 * Single source of truth for transition request + response shape across
 * client preview (src/hooks/useCWHTransition.ts) and server enforcement
 * (app/api/cwh/transition/route.ts). Both call evaluateCWH(input) from
 * src/lib/cwh/evaluate.ts which consumes the parsed TransitionInput.
 *
 * LOCKED canon (URANA-enforced):
 *   - 4 target values: 'task' · 'milestone' · 'od' · 'residue'
 *   - 6 KAIROS modes: 'AUI' · 'HUD' · 'TUUI' · 'GUI' · 'Dashboard' · 'Ambient'
 *   - PATHOS axis order: Stress · Focus · Curiosity · Fatigue · Satisfaction
 *   - 12 CWH rule IDs CWH-R-01..CWH-R-12 (see evaluate.ts)
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { z } from 'zod';

// ─── ENUMS (canon · do not reorder) ─────────────────────────────────────
// Phase 3a · preflight rule 7.4 extends the target enum from 4 base values
// to 4 base + 6 update variants. Update variants flow through the dedicated
// /api/sheets/update route (Spec 3a.02). The Phase 2 evaluator strips the
// '-update' suffix before matching rules, so existing CWH-R-01..CWH-R-12
// continue to fire correctly for update targets.
export const CWH_TARGETS = [
  'task',
  'milestone',
  'od',
  'residue',
  'task-update',
  'kpi-update',
  'od-update',
  'milestone-update',
  'residue-update',
  'surface-update',
] as const;
export type CWHTarget = (typeof CWH_TARGETS)[number];

export const KAIROS_MODES_API = [
  'AUI',
  'HUD',
  'TUUI',
  'GUI',
  'Dashboard',
  'Ambient',
] as const;
export type KairosModeApi = (typeof KAIROS_MODES_API)[number];

export const CWH_RULE_IDS = [
  'CWH-R-01',
  'CWH-R-02',
  'CWH-R-03',
  'CWH-R-04',
  'CWH-R-05',
  'CWH-R-06',
  'CWH-R-07',
  'CWH-R-08',
  'CWH-R-09',
  'CWH-R-10',
  'CWH-R-11',
  'CWH-R-12',
] as const;
export type CWHRuleId = (typeof CWH_RULE_IDS)[number];

export type CWHVerdict = 'allow' | 'deny';

// ─── ZOD SCHEMAS ────────────────────────────────────────────────────────
// PATHOS axis order is LOAD-BEARING — do not reorder.
const PathosSchema = z.object({
  stress: z.number().min(0).max(100),
  focus: z.number().min(0).max(100),
  curiosity: z.number().min(0).max(100),
  fatigue: z.number().min(0).max(100),
  satisfaction: z.number().min(0).max(100),
});

const ActorSchema = z.object({
  session: z.string().min(1).max(128),
  pathos: PathosSchema,
});

const ContextSchema = z.object({
  kairosMode: z.enum(KAIROS_MODES_API),
  doctrineScore: z.number().min(0).max(100),
});

export const TransitionRequestSchema = z.object({
  target: z.enum(CWH_TARGETS),
  targetId: z.string().min(1).max(64),
  fromState: z.string().min(1).max(64),
  toState: z.string().min(1).max(64),
  actor: ActorSchema,
  context: ContextSchema,
  // Phase 3a · optional client-supplied idempotency key (Spec 3a.04).
  // Format: 8-64 chars [a-zA-Z0-9_-] · MUST NEVER carry PII or session secrets.
  idempotencyKey: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/).optional(),
});

export type TransitionRequest = z.infer<typeof TransitionRequestSchema>;

export const TransitionResponseSchema = z.object({
  verdict: z.enum(['allow', 'deny']),
  ruleId: z.enum(CWH_RULE_IDS),
  doctrineDelta: z.number(),
  reason: z.string().optional(),
  auditId: z.string().regex(/^alog_[0-9A-HJKMNP-TV-Z]{26}$/),
  timestamp: z.string().datetime(),
});

export type TransitionResponse = z.infer<typeof TransitionResponseSchema>;

// ─── EVALUATOR RESULT (no audit/timestamp — those are added by the route)
export type EvaluatorResult = {
  verdict: CWHVerdict;
  ruleId: CWHRuleId;
  doctrineDelta: number;
  reason?: string;
};

// ─── ERROR ENVELOPE (401 · 403 · 409 · 429 · 500) ───────────────────────
export type ErrorResponse = {
  error: string;
  code:
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'IDEMPOTENCY_COLLISION'
    | 'RATE_LIMITED'
    | 'INVALID_INPUT'
    | 'SERVER_ERROR';
  requestId: string;
};
