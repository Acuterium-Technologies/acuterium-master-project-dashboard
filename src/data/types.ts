/**
 * Acuterium Master Ops — shared type contracts for ported v1.3 data.
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export type Channel = {
  id: string;
  name: string;
  surface: string;
  access: string;
  coverage: string;
  status: string;
  output: string;
  conflicts: number;
  note?: string;
  residueVerdict?: string | null;
};

export type Decision = {
  id: string;
  item: string;
  need: string;
  blocking: string;
  rec: string;
  status: string;
  priority?: string;
};

export type Conflict = {
  id: string;
  topic: string;
  srcA: string;
  srcB: string;
  desc: string;
  resolution: string;
  status: string;
};

export type Surface = {
  name: string;
  url: string;
  host: string;
  announce: string;
  residue: string;
  action: string;
};

export type Sprint = {
  id: string;
  range: string;
  scope: string;
  status: string;
  tag: string;
  verify: string;
};

export type SpineRow = {
  repo: string;
  layer: string;
  purpose: string;
  state: string;
  action: string;
  od: string;
};

export type Stage2Step = {
  id: string;
  title: string;
  sub: string[];
};

export type CanonEntry = {
  cf: string;
  forb: string;
};

export type Stage1Item = {
  id: string;
  title: string;
  done: boolean;
};

export type FutureStage = {
  id: string;
  name: string;
  ts: string;
  sub: string[];
};

export type PortfolioRow = {
  id: string;
  name: string;
  type: string;
  product: string;
  layer: string;
  status: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sensitivity: 'Sovereign' | 'Confidential' | 'Internal' | 'Public';
  channels: string[];
  action: string;
  ownerDecision: string;
};

export type Milestone = {
  id: string;
  title: string;
  phase: number;
  day: number;
  criterion: string;
  status: string;
};

export type KPI = {
  id: string;
  name: string;
  source: string;
  target: string;
  value: string;
  state: 'achieved' | 'on_track' | 'at_risk' | 'off_track';
  trend?: number[];
};

export type Task = {
  id: string;
  phase: number;
  day: number;
  cat: 'OPERATOR' | 'COWORK' | 'CLAUDE';
  title: string;
};

export type DoctrineClassKey =
  | 'compliant'
  | 'partial'
  | 'violated'
  | 'sovereign'
  | 'psi'
  | 'ruzn'
  | 'persuasive'
  | 'cwh';

export type Doctrine = {
  id: string;
  name: string;
  short: string;
  classKey: DoctrineClassKey;
  tag: string;
  summary: string;
  principles: string[];
};

export type ResidueVerdict = 'NOT-RUN' | 'CLEAN' | 'FLAGGED' | 'BLOCKED';

export type PersistedState = {
  done: Record<string, boolean>;
  closedMs: Record<string, boolean>;
  closedODs: Record<string, boolean>;
  residueVerdict: ResidueVerdict;
};

export type DoctrineScore = {
  score: number;
  state: DoctrineClassKey;
  evidence: string;
};

export type CompositeScore = {
  avg: number;
  compliant: number;
  violated: number;
  total: number;
  scores: Array<DoctrineScore & { id: string; name: string; classKey: DoctrineClassKey }>;
};
