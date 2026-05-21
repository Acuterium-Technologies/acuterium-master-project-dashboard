/**
 * Static data barrel for the Master Ops surface.
 * Sheet-backed tabs (Matrix · Tasks · Milestones · KPIs) hydrate via
 * /api/sheet at runtime; everything else is shipped as static constants
 * from this barrel so the dashboard renders even when the gated data
 * plane is offline (Issue 2-B · graceful empty states).
 */
export { CHANNELS } from './channels';
export { DECISIONS } from './decisions';
export { CONFLICTS } from './conflicts';
export { SURFACES } from './surfaces';
export { SPRINTS } from './sprints';
export { SPINE } from './spine';
export { STAGE2 } from './stage2';
export { CANON } from './canon';
export { STAGE1 } from './stage1';
export { FUTURE } from './future';
export { PORTFOLIO } from './portfolio';
export { MILESTONES } from './milestones';
export { TASKS } from './tasks';
export { KPIS } from './kpis';
export { DOCTRINES } from './doctrines';

export type {
  Channel,
  Decision,
  Conflict,
  Surface,
  Sprint,
  SpineRow,
  Stage2Step,
  CanonEntry,
  Stage1Item,
  FutureStage,
  PortfolioRow,
  Milestone,
  KPI,
  Task,
  Doctrine,
  DoctrineClassKey,
  PersistedState,
  ResidueVerdict,
  DoctrineScore,
  CompositeScore,
} from './types';

export * from './engineering-log';
