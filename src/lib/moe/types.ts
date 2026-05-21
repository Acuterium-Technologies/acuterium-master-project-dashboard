/**
 * MOE Expert Matrix · shared types · Phase 3b.02.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
export const EXPERT_DOMAINS = [
  'language',
  'reasoning',
  'code',
  'legal',
  'finance',
  'security',
] as const;
export type ExpertDomain = (typeof EXPERT_DOMAINS)[number];

export type ExpertNode = {
  id: number; // 0..784
  domain: ExpertDomain;
  layer: number; // routing layer (0..7)
  active: boolean;
  activationStrength: number; // 0.0..1.0
};

export type MOESnapshot = {
  timestamp: string;
  experts: ExpertNode[]; // length 785
  totalActive: number;
  domainCounts: Record<ExpertDomain, number>;
};

export const TOTAL_EXPERTS = 785;
export const GRID_COLS = 35;
export const GRID_ROWS = 23; // 35 × 23 = 805 cells; trailing 20 stay inactive
