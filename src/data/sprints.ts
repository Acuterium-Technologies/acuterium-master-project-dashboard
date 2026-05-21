import type { Sprint } from './types';

/**
 * 4 Sprints (S0 .. S3).
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 776-781.
 */
export const SPRINTS: Sprint[] = [
  {id:'S0',range:'27-29 Apr 2026',scope:'Track A — Next.js scaffold · IDRAK SDK · ACAI shell · Arabic homepage · Agent-Oman CNAME · OCF L1-L6 · TokenBridge · ASIP v2 · Q-ARC · AQUIGGS · SSE chat · General Citizen persona · Vitest/Playwright · CHRONOS prayer-time · PATHOS 5-axis',status:'closed (verification pending)',tag:'v0.1.0-track-a',verify:'CH-2 to confirm tag presence'},
  {id:'S1',range:'04-08 May 2026',scope:'IDRAK SDK v0.1 (6 AQUIGGS) · Shards C-03..C-07 · Foreign-Investor + Legal personas · Persona switcher UI · Sprint review · Audit + tag',status:'closure pending',tag:'v0.2.0 scheduled',verify:'CH-2 + CH-3 confirm tag + deliverables + carryover'},
  {id:'S2',range:'Days 15-28 (proposed)',scope:'Contracts spine + Doctrine repo · acuterium-contracts schemas · acuterium-doctrine repo · nahra-v8 Section 0 · RUZN.AI Manus cleanup · Edna brief · ZURD AcuKey GitHub migration · live-surface announcement',status:'proposed',tag:'v0.3.0',verify:'Scope after fusion completes'},
  {id:'S3',range:'Days 31-44',scope:'Derived from Day-30 refreshed top-10',status:'placeholder',tag:'v0.4.0',verify:'After Day-30 hand-back'},
];
