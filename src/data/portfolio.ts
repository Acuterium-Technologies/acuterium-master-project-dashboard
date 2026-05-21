import type { PortfolioRow } from './types';

/**
 * 28-row Portfolio Matrix — Acuterium evidence baseline.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 582-611.
 *
 * Sheet-tab Matrix overrides this static set when the live /api/sheet
 * route returns rows; this baseline guarantees a non-empty UI when the
 * gated data plane is offline.
 */
export const PORTFOLIO: PortfolioRow[] = [
  {id:'P01-R-001',name:'Baranurion',type:'repo',product:'Orchestration (W-09)',layer:'L2',status:'canonical',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2','08-May'],action:'CH-2 verify code/README parity',ownerDecision:'No'},
  {id:'P02-R-001',name:'Diaran-AI',type:'repo',product:'Routing (W-01)',layer:'L3',status:'production · v2.0.0',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2','08-May'],action:'CH-2 re-verify tests + provider list',ownerDecision:'No'},
  {id:'P03-R-001',name:'acuterium-contracts',type:'repo',product:'Contracts (L1)',layer:'L1',status:'STUB — highest-leverage gap',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2'],action:'Fill schemas (matrix/judge/orchestrate/route/ASIP/TokenBridge)',ownerDecision:'OD-02'},
  {id:'P04-R-001',name:'IDRAK',type:'repo',product:'Output Discipline (L5)',layer:'L5',status:'Sprint S1 in-flight',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2','CH-3'],action:'CH-2 confirm v0.2.0; CH-3 thread truth on S1 close',ownerDecision:'No'},
  {id:'P05-R-001',name:'acuterium-master-database',type:'repo',product:'Doctrinal canon (L0)',layer:'L0',status:'canonical · v31',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2'],action:'Extend ✗/✓ table; CI lint',ownerDecision:'No'},
  {id:'P06-R-001',name:'acuterium-skills-marketplace',type:'repo',product:'Skills registry',layer:'L0/L3',status:'production v7.0.0',confidence:'HIGH',sensitivity:'Internal',channels:['CH-2','CH-3'],action:'CH-2 read SKILL-REG CSV; resolve 4122 vs 4535',ownerDecision:'OD-11'},
  {id:'P07-R-001',name:'nahra-v8',type:'repo',product:'NAHRĀ Sovereign Browser (T14, L6)',layer:'L6',status:'Section 0 doctrine conflict OPEN',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2'],action:'Reconcile Section 0 to honest-attribution',ownerDecision:'OD-03'},
  {id:'P08-R-001',name:'hisn-al-wujud',type:'repo',product:'Defensive stack (Erebus-CSE)',layer:'sec',status:'license gap',confidence:'MEDIUM',sensitivity:'Sovereign',channels:['CH-2'],action:'Add LICENSE/SECURITY; prompt-injection defense',ownerDecision:'OD-12'},
  {id:'P09-R-001',name:'ruzn-lite',type:'repo',product:'RUZN.AI lightweight surface',layer:'L6',status:'build',confidence:'MEDIUM',sensitivity:'Confidential',channels:['CH-2'],action:'Add LICENSE/SECURITY',ownerDecision:'No'},
  {id:'P10-R-001',name:'mada-godseye',type:'repo',product:'MADA (E-06)',layer:'L5/L6',status:'pre-launch blockers',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-2','CH-3'],action:'Synthesis engine; PRISM integration; bilingual briefs',ownerDecision:'No'},
  {id:'P11-R-001',name:'logo-registry',type:'repo',product:'Brand',layer:'cross',status:'production',confidence:'MEDIUM',sensitivity:'Internal',channels:['CH-2'],action:'Add LICENSE/SECURITY',ownerDecision:'No'},
  {id:'P12-R-001',name:'AcuTect-CODEX',type:'repo',product:'Sovereign DevOps control plane',layer:'cross',status:'canonical doctrine source',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-1','CH-2'],action:'Lock spelling AcuTect-CODEX; fix folder/repo refs',ownerDecision:'No'},
  {id:'P13-R-001',name:'Acuterium_Core (legacy)',type:'repo',product:'Archived — consolidated into Baranurion',layer:'L2',status:'sunset · archived',confidence:'HIGH',sensitivity:'Internal',channels:['CH-2'],action:'CH-2 sweep for residual imports',ownerDecision:'No'},
  {id:'P14-S-001',name:'acuterium.ai (flagship)',type:'live-surface',product:'Corporate flagship',layer:'L6',status:'live · unannounced',confidence:'HIGH',sensitivity:'Public',channels:['CH-4'],action:'Announcement timing decision',ownerDecision:'OD-05'},
  {id:'P15-S-001',name:'StratEDGE',type:'live-surface',product:'StratEDGE (T15)',layer:'L6',status:'live · unannounced',confidence:'MEDIUM',sensitivity:'Confidential',channels:['CH-4'],action:'CH-4 URL + DNS verify; announcement',ownerDecision:'OD-05'},
  {id:'P16-S-001',name:'Mārel',type:'live-surface',product:'Arabic conversational',layer:'L6',status:'live · unannounced',confidence:'MEDIUM',sensitivity:'Public',channels:['CH-4'],action:'Verify URL; canon lock; announcement',ownerDecision:'OD-05'},
  {id:'P17-S-001',name:'Agent-Oman',type:'live-surface',product:'Government agent',layer:'L6',status:'live · unannounced (S0 deploy 27-Apr)',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-4'],action:'CH-4 live verify; coordinated launch',ownerDecision:'OD-05'},
  {id:'P18-S-001',name:'RUZN.AI',type:'live-surface',product:'Sovereign legal/government',layer:'L6',status:'live · MANUS RESIDUE RISK HIGH',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-6'],action:'MANDATORY: CH-6 + security-auditor residue scan',ownerDecision:'OD-04'},
  {id:'P19-S-001',name:'URANA',type:'live-surface',product:'QMS / Audit / Accreditation',layer:'L6',status:'live · pre-launch blockers',confidence:'HIGH',sensitivity:'Confidential',channels:['CH-4'],action:'Resolve 3 blockers; URL verify',ownerDecision:'OD-05'},
  {id:'P20-S-001',name:'AMARA',type:'live-surface',product:'ChatGPT stopgap',layer:'L6',status:'STOPGAP — migration plan needed',confidence:'HIGH',sensitivity:'Internal',channels:['CH-5'],action:'Author migration plan to sovereign stack',ownerDecision:'OD-06'},
  {id:'P21-H-001',name:'ZURD AcuKey (ESP32-C6)',type:'hardware',product:'Hardware workstream',layer:'L0+L1',status:'POOC operational',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-1'],action:'Migrate to GitHub; finalize vault SPIFFS; wire NFC',ownerDecision:'OD-07'},
  {id:'P22-H-001',name:'NanoLM',type:'hardware',product:'Hardware workstream',layer:'L4',status:'concept · owner-asserted',confidence:'LOW',sensitivity:'Sovereign',channels:['CH-3','CH-4'],action:'Channels 3/4 surface context; owner brief elicitation',ownerDecision:'OD-08'},
  {id:'P23-H-001',name:'LionFist',type:'hardware',product:'Hardware workstream',layer:'TBD',status:'concept · owner-asserted',confidence:'LOW',sensitivity:'Sovereign',channels:['CH-3','CH-4'],action:'Channels 3/4 surface; owner elicitation',ownerDecision:'OD-09'},
  {id:'P24-E-001',name:'Edna (SIGINT)',type:'product-line',product:'Erebus-CSE / Qareen-OSINT E-03',layer:'L5/L6',status:'reclassified 20-May (was HuHud)',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-1'],action:'Brief; map shards; rename HuHud→Edna; registry',ownerDecision:'OD-10'},
  {id:'P25-K-001',name:'Pan Framework v1.0',type:'orchestration',product:'LLM research orchestration',layer:'L3',status:'deployed · 5 agents',confidence:'HIGH',sensitivity:'Internal',channels:['CH-3'],action:'Complete 57 placeholder entries; Phase 5 Tier-2',ownerDecision:'No'},
  {id:'P26-K-001',name:'Proprietary Skill Suite',type:'skills',product:'Skills marketplace (proprietary)',layer:'L0/L3',status:'shipped · 4 core skills',confidence:'HIGH',sensitivity:'Sovereign',channels:['CH-3'],action:'CH-3 enumerate proprietary skills with versions',ownerDecision:'No'},
  {id:'P27-T-001',name:'Sprint S0 (Track A)',type:'sprint',product:'Cross-cutting',layer:'sprint',status:'closed (verification pending)',confidence:'MEDIUM',sensitivity:'Internal',channels:['CH-2'],action:'CH-2 confirm tag v0.1.0-track-a',ownerDecision:'No'},
  {id:'P28-T-001',name:'Sprint S1 (IDRAK + Shards)',type:'sprint',product:'Cross-cutting',layer:'sprint',status:'closure pending · v0.2.0 unverified',confidence:'LOW',sensitivity:'Internal',channels:['CH-2','CH-3'],action:'CH-2/CH-3 confirm tag + deliverables + carryover',ownerDecision:'No'},
];
