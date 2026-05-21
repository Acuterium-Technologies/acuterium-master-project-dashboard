/**
 * Engineering completion log - Phase 1A through Phase 2 shipped to production.
 * Source of truth: GitHub commits on main branch.
 * Updated by: Update-Acuterium-Dashboard-Data.ps1 on 2026-05-21
 */

export type EngineeringEntry = {
  phase: string;
  commit: string;
  status: 'SHIPPED' | 'IN-FLIGHT' | 'PENDING' | 'BLOCKED';
  date: string;
  title: string;
};

export const ENGINEERING_LOG: EngineeringEntry[] = [
  { phase: '1A', commit: '5b9fde5', status: 'SHIPPED', date: '2026-05-21', title: "PWA infrastructure (manifest, SW, icons)" },
  { phase: '1A-hotfix', commit: '94aab72', status: 'SHIPPED', date: '2026-05-21', title: "Latin font subset fix" },
  { phase: '1B', commit: '153fa62', status: 'SHIPPED', date: '2026-05-21', title: "Engine substrate (31 files)" },
  { phase: '1C', commit: '6495ff3', status: 'SHIPPED', date: '2026-05-21', title: "8 modes + Acuterium brand + HeroBrandLockup (40 files)" },
  { phase: '1D', commit: '600e4be', status: 'SHIPPED', date: '2026-05-21', title: "5 cognitive engines + mode-physics CSS (10 files)" },
  { phase: '1E', commit: '6cdefaa', status: 'SHIPPED', date: '2026-05-21', title: "App() root wire-up - 532 LOC - SW v1.4.0-rc.3" },
  { phase: '2', commit: '9c782c2', status: 'SHIPPED', date: '2026-05-21', title: "Server-side CWH gate at /api/cwh/transition - v1.4.0-rc.2" },
  { phase: '3a', commit: 'PENDING', status: 'PENDING', date: '2026-05-21', title: "Foundation + QA-tooling baseline (Postgres mirror + Sheets adapter)" },

];

export const QA_PHASE_1E = {
  pass: 48,
  total: 48,
  p0: 0,
  p1: 0,
  p2: 0,
  timestamp: '2026-05-21T12:47:59+04:00',
  tag: 'v1.4.0-rc.1',
  commit: '6cdefaa',
  sw: 'acu-master-ops-v1.4.0-rc.3',
};

export const QA_PHASE_2 = {
  tests_passing: 27,
  tests_failing: 0,
  preflight: '16/16',
  smoke: '4/4',
  bundle_delta_kb: 2,
  timestamp: '2026-05-21T09:35:00.000Z',
  tag: 'v1.4.0-rc.2',
  commit: '9c782c2',
  vercel_dpl: 'dpl_8KhhiXUSUib2DqD7Dc2EzuTXrJao',
};