import type { Conflict } from './types';

/**
 * 10 cross-channel conflicts logged.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 751-762.
 */
export const CONFLICTS: Conflict[] = [
  {id:'CF-01',topic:'Provider attribution policy',srcA:'Diaran-AI README',srcB:'nahra-v8 Section 0',desc:'D-01 doctrine contradiction',resolution:'OD-03 update nahra-v8',status:'open'},
  {id:'CF-02',topic:'Name canon: AcuTect',srcA:'PLAN.md',srcB:'GitHub repo + local folder',desc:'Three spellings',resolution:'Lock AcuTect-CODEX (hyphen)',status:'open'},
  {id:'CF-03',topic:'Name canon: shards',srcA:'Repo names',srcB:'CSV internal codes',desc:'Public vs internal-code drift',resolution:'Repo names public; codes classified',status:'open'},
  {id:'CF-04',topic:'Name canon: brand',srcA:'master-database (diacritics)',srcB:'Other repos (stripped)',desc:'Diacritic loss',resolution:'CI lint enforces master-database forms',status:'open'},
  {id:'CF-05',topic:'Skill count',srcA:'09-May Doctrine v2 ≈4,122',srcB:'Claude memory 4,535',desc:'Counting drift',resolution:'CH-2 canonical CSV read',status:'open'},
  {id:'CF-06',topic:'Sprint S0 closure',srcA:'CSV row 45 closed',srcB:'CSV status "Needs Verification"',desc:'Tag verification pending',resolution:'CH-2 confirm tag presence',status:'open'},
  {id:'CF-07',topic:'Manus role',srcA:'20-May Tier-1 mandatory',srcB:'09-May Golden Rule #4',desc:'Policy ambiguity',resolution:'OD-13: Tier-1 retrieval + quarantine residue',status:'open'},
  {id:'CF-08',topic:'IDRAK builder',srcA:'Claude (engineering)',srcB:'Perplexity Computer (repo lock)',desc:'Attribution split',resolution:'Split: Perplexity research/spec · Claude build/audit',status:'open'},
  {id:'CF-09',topic:'Plan generation source',srcA:'20-May playbook',srcB:'08/09-May earlier plans',desc:'12-day handoff gap',resolution:'Prompt Suite v1.1 merges both',status:'resolved'},
  {id:'CF-10',topic:'Live-surface URLs',srcA:'6 named surfaces',srcB:'Only 1 URL confirmed',desc:'Existence high · URL low',resolution:'CH-4 Comet live verify all',status:'open'},
];
