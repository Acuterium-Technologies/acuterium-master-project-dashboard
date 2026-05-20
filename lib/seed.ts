export type MatrixRow = {
  id: string;
  name: string;
  product: string;
  layer: string;
  status: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sensitivity: 'Sovereign' | 'Confidential' | 'Internal' | 'Public';
  action: string;
  ownerDecision: string;
  channels?: string;
};

export type Task = {
  id: string;
  phase: 0 | 1 | 2 | 3;
  day: number;
  cat: 'COWORK' | 'OPERATOR' | 'CLAUDE';
  title: string;
  done: boolean;
};

export type Milestone = {
  id: string;
  day: number;
  title: string;
  criterion: string;
  closed: boolean;
};

export type Kpi = {
  id: string;
  phase: 0 | 1 | 2 | 3;
  name: string;
  target: string;
  value: string;
  source: string;
};

export const SEED_MATRIX: MatrixRow[] = [
  { id:'P01-R-001', name:'Baranurion', product:'Orchestration (W-09)', layer:'L2', status:'canonical', confidence:'HIGH', sensitivity:'Sovereign', action:'CH-2 verify code/README parity', ownerDecision:'No' },
  { id:'P02-R-001', name:'Diaran-AI', product:'Routing (W-01)', layer:'L3', status:'canonical', confidence:'HIGH', sensitivity:'Sovereign', action:'CH-2 re-verify 138/138 tests', ownerDecision:'No' },
  { id:'P03-R-001', name:'acuterium-contracts', product:'Contracts (L1)', layer:'L1', status:'STUB — highest-leverage gap', confidence:'HIGH', sensitivity:'Sovereign', action:'Fill schemas (Week-2 priority)', ownerDecision:'OD-02 approve schema set' },
  { id:'P04-R-001', name:'IDRAK', product:'Output Discipline (L5)', layer:'L5', status:'current — S1 in-flight', confidence:'HIGH', sensitivity:'Sovereign', action:'Confirm v0.2.0 tag', ownerDecision:'No' },
  { id:'P05-R-001', name:'acuterium-master-database', product:'Doctrinal canon (L0)', layer:'L0', status:'canonical — v31', confidence:'HIGH', sensitivity:'Sovereign', action:'Extend naming canon table', ownerDecision:'No' },
  { id:'P06-R-001', name:'acuterium-skills-marketplace', product:'Skills registry', layer:'L0/L3', status:'v7.0.0 (~4,500 skills)', confidence:'HIGH', sensitivity:'Internal', action:'CH-2 reconcile skill count', ownerDecision:'No' },
  { id:'P07-R-001', name:'nahra-v8', product:'NAHRĀ Browser (T14)', layer:'L6', status:'current — D-01 conflict OPEN', confidence:'HIGH', sensitivity:'Sovereign', action:'Reconcile Section 0 (OD-03)', ownerDecision:'OD-03 approve language' },
  { id:'P08-R-001', name:'hisn-al-wujud', product:'Defensive stack', layer:'Security', status:'current', confidence:'MEDIUM', sensitivity:'Sovereign', action:'Add LICENSE/SECURITY', ownerDecision:'OD-12 license choice' },
  { id:'P09-R-001', name:'ruzn-lite', product:'RUZN.AI lightweight', layer:'L6', status:'current', confidence:'MEDIUM', sensitivity:'Confidential', action:'Add LICENSE; verify S0/S1 merges', ownerDecision:'No' },
  { id:'P10-R-001', name:'mada-godseye', product:'MADA (E-06)', layer:'L5/L6', status:'current — blockers documented', confidence:'HIGH', sensitivity:'Sovereign', action:'Build synthesis engine; wire PRISM', ownerDecision:'No' },
  { id:'P12-R-001', name:'AcuTect-CODEX', product:'Sovereign DevOps', layer:'Cross-cutting', status:'canonical doctrine source', confidence:'HIGH', sensitivity:'Sovereign', action:'Lock spelling AcuTect-CODEX', ownerDecision:'No' },
  { id:'P14-S-001', name:'acuterium.ai', product:'Corporate flagship', layer:'L6', status:'live · unannounced', confidence:'HIGH', sensitivity:'Public', action:'Channel 4 verify; announcement timing', ownerDecision:'OD-05 announcement' },
  { id:'P15-S-001', name:'StratEDGE', product:'StratEDGE (T15)', layer:'L6', status:'live · unannounced', confidence:'MEDIUM', sensitivity:'Confidential', action:'Channel 4 URL + DNS verify', ownerDecision:'OD-05 announcement' },
  { id:'P16-S-001', name:'Mārel', product:'Arabic conversational', layer:'L6', status:'live · unannounced', confidence:'MEDIUM', sensitivity:'Public', action:'Verify URL; lock spelling Mārel', ownerDecision:'OD-05 announcement' },
  { id:'P17-S-001', name:'Agent-Oman', product:'Government agent', layer:'L6', status:'live · unannounced', confidence:'HIGH', sensitivity:'Sovereign', action:'Channel 4 live verify', ownerDecision:'OD-05 announcement' },
  { id:'P18-S-001', name:'RUZN.AI', product:'Sovereign legal/government', layer:'L6', status:'live · MANUS RESIDUE RISK', confidence:'HIGH', sensitivity:'Sovereign', action:'CH-6 residue scan MANDATORY', ownerDecision:'OD-04 PRIO-1 post-mortem' },
  { id:'P19-S-001', name:'URANA', product:'QMS / Audit', layer:'L6', status:'live · unannounced; blockers', confidence:'HIGH', sensitivity:'Confidential', action:'Resolve 3 pre-launch blockers', ownerDecision:'OD-05 announcement' },
  { id:'P20-S-001', name:'AMARA', product:'AMARA (ChatGPT stopgap)', layer:'L6', status:'STOPGAP — not on Acuterium infra', confidence:'HIGH', sensitivity:'Internal', action:'Author migration plan', ownerDecision:'OD-06 migration target' },
  { id:'P21-H-001', name:'ZURD AcuKey', product:'Hardware workstream', layer:'L0+L1', status:'POOC operational — 3 modes verified', confidence:'HIGH', sensitivity:'Sovereign', action:'Migrate to GitHub; finalize vault.cpp', ownerDecision:'OD-07 repo migration' },
  { id:'P22-H-001', name:'NanoLM', product:'Hardware workstream', layer:'L4', status:'Concept (owner-asserted)', confidence:'LOW', sensitivity:'Sovereign', action:'CH-3/4 surface prior context', ownerDecision:'OD-08 product brief' },
  { id:'P23-H-001', name:'LionFist', product:'Hardware workstream', layer:'TBD', status:'Concept (owner-asserted)', confidence:'LOW', sensitivity:'Sovereign', action:'CH-3/4 surface prior context', ownerDecision:'OD-09 product brief' },
  { id:'P24-E-001', name:'Edna (SIGINT)', product:'Erebus-CSE / Qareen E-03', layer:'L5/L6', status:'reclassified 20-May (from HuHud)', confidence:'HIGH', sensitivity:'Sovereign', action:'Rename HuHud→Edna; add to skills', ownerDecision:'OD-10 shard mapping' },
  { id:'P25-K-001', name:'Pan Framework v1.0', product:'LLM research orchestration', layer:'L3', status:'deployed — 5 agents operational', confidence:'HIGH', sensitivity:'Internal', action:'Complete 57 placeholder models', ownerDecision:'No' },
  { id:'P26-K-001', name:'Proprietary Skill Suite', product:'Skills marketplace', layer:'L0/L3', status:'shipped — 4+ core skills live', confidence:'HIGH', sensitivity:'Sovereign', action:'Channel 3 enumerate full list', ownerDecision:'No' },
  { id:'P27-T-001', name:'Sprint S0 (Track A)', product:'Cross-cutting', layer:'N/A', status:'closed claimed (verify pending)', confidence:'MEDIUM', sensitivity:'Internal', action:'CH-2 confirm v0.1.0-track-a tag', ownerDecision:'No' },
  { id:'P28-T-001', name:'Sprint S1', product:'Cross-cutting', layer:'N/A', status:'IN-FLIGHT @ last audit', confidence:'LOW', sensitivity:'Internal', action:'CH-2/3 confirm v0.2.0 closure', ownerDecision:'No' },
  { id:'P29-D-001', name:'7-Layer Doctrine v2', product:'Doctrine (L0)', layer:'meta', status:'authored 09-May (not committed)', confidence:'HIGH', sensitivity:'Sovereign', action:'Create acuterium-doctrine repo', ownerDecision:'OD-01 repo creation' },
  { id:'P30-D-001', name:'Evidence Matrix', product:'Source-of-truth index', layer:'meta', status:'skeleton — populated by 6 channels', confidence:'HIGH', sensitivity:'Sovereign', action:'Dispatch prompts; fold reports', ownerDecision:'No' }
];

export const SEED_TASKS: Task[] = [
  { id:'T0-01', phase:0, day:0, cat:'OPERATOR', title:'Verify Perplexity Pro subscription', done:true },
  { id:'T0-02', phase:0, day:0, cat:'OPERATOR', title:'Verify ChatGPT subscription', done:true },
  { id:'T0-03', phase:0, day:0, cat:'COWORK', title:'Verify Claude Pro/Max tier', done:true },
  { id:'T0-04', phase:0, day:0, cat:'OPERATOR', title:'Verify Claude Code VSCode extension', done:true },
  { id:'T0-05', phase:0, day:0, cat:'OPERATOR', title:'Verify Claude Code Web GitHub connector', done:true },
  { id:'T0-06', phase:0, day:0, cat:'OPERATOR', title:'Verify Manus AI access + credit', done:true },
  { id:'T0-07', phase:0, day:0, cat:'OPERATOR', title:'Verify GitHub gh CLI auth', done:true },
  { id:'T0-08', phase:0, day:0, cat:'OPERATOR', title:'Verify Google Drive connector', done:true },
  { id:'T0-09', phase:0, day:0, cat:'OPERATOR', title:'Verify OpenAI Codex desktop', done:true },
  { id:'T0-10', phase:0, day:0, cat:'COWORK', title:'Create campaign folder structure (8 subfolders)', done:true },
  { id:'T0-11', phase:0, day:0, cat:'OPERATOR', title:'Read 3 reference documents end-to-end', done:true },
  { id:'T0-12', phase:0, day:0, cat:'OPERATOR', title:'Sign M-00 milestone closure', done:true },
  { id:'T1-CH1-01', phase:1, day:1, cat:'COWORK', title:'Prepare CH-1 prompt block', done:false },
  { id:'T1-CH1-02', phase:1, day:1, cat:'OPERATOR', title:'Dispatch CH-1 Claude Code VSCode', done:false },
  { id:'T1-CH1-03', phase:1, day:1, cat:'OPERATOR', title:'Capture CH-1 output to canonical path', done:false },
  { id:'T1-CH1-04', phase:1, day:1, cat:'COWORK', title:'Update dispatch log with CH-1 status', done:false },
  { id:'T1-CH2-01', phase:1, day:1, cat:'COWORK', title:'Prepare CH-2 prompt block', done:false },
  { id:'T1-CH2-02', phase:1, day:1, cat:'OPERATOR', title:'Dispatch CH-2 Claude Code Web', done:false },
  { id:'T1-CH2-03', phase:1, day:1, cat:'OPERATOR', title:'Capture CH-2 output (GitHub + threads)', done:false },
  { id:'T1-CH2-04', phase:1, day:1, cat:'COWORK', title:'Flag Sprint S0/S1 closure verdict', done:false },
  { id:'T1-CH3-01', phase:1, day:1, cat:'OPERATOR', title:'Dispatch CH-3 Pass A (outside projects)', done:false },
  { id:'T1-CH3-02', phase:1, day:1, cat:'OPERATOR', title:'Dispatch CH-3 Pass B (per project)', done:false },
  { id:'T1-CH3-03', phase:1, day:1, cat:'COWORK', title:'Consolidate CH-3 Pass A + B reports', done:false },
  { id:'T1-CH4-01', phase:1, day:2, cat:'OPERATOR', title:'Dispatch CH-4 Perplexity Pass A', done:false },
  { id:'T1-CH4-02', phase:1, day:2, cat:'OPERATOR', title:'Dispatch CH-4 Comet Pass B verification', done:false },
  { id:'T1-CH4-03', phase:1, day:2, cat:'COWORK', title:'Mark Live_Surfaces VERIFIED/FAILED', done:false },
  { id:'T1-CH5-01', phase:1, day:2, cat:'OPERATOR', title:'Dispatch CH-5 ChatGPT Pass A', done:false },
  { id:'T1-CH5-02', phase:1, day:2, cat:'OPERATOR', title:'Dispatch CH-5 per-project Pass B', done:false },
  { id:'T1-CH6-01', phase:1, day:3, cat:'OPERATOR', title:'Dispatch CH-6 Manus (QUARANTINE)', done:false },
  { id:'T1-CH6-02', phase:1, day:3, cat:'CLAUDE', title:'Run security-auditor residue scan', done:false },
  { id:'T1-CH6-03', phase:1, day:3, cat:'OPERATOR', title:'CH-6 release decision (CLEAN/FLAGGED/BLOCKED)', done:false },
  { id:'T2-D4-01', phase:2, day:4, cat:'COWORK', title:'Day 4: Normalise 6 reports against canon', done:false },
  { id:'T2-D5-01', phase:2, day:5, cat:'COWORK', title:'Day 5: Populate Master_Matrix from JSON blocks', done:false },
  { id:'T2-D5-02', phase:2, day:5, cat:'COWORK', title:'Day 5: Populate auxiliary sheets', done:false },
  { id:'T2-D6-01', phase:2, day:6, cat:'COWORK', title:'Day 6: Resolve trivial conflicts', done:false },
  { id:'T2-D6-02', phase:2, day:6, cat:'OPERATOR', title:'Day 6: Adjudicate non-trivial conflicts', done:false },
  { id:'T2-D7-01', phase:2, day:7, cat:'CLAUDE', title:'Day 7: Run ACU-STRAT-001 per project', done:false },
  { id:'T2-D7-02', phase:2, day:7, cat:'CLAUDE', title:'Day 7: Run PRISM-SIE per project', done:false },
  { id:'T2-D7-03', phase:2, day:7, cat:'CLAUDE', title:'Day 7: Run RIA cascade per project', done:false },
  { id:'T2-D7-04', phase:2, day:7, cat:'COWORK', title:'Lock top 10 priority queue', done:false },
  { id:'T3-D8-01', phase:3, day:8, cat:'OPERATOR', title:'Schedule arbitration session with Dr. Jay', done:false },
  { id:'T3-D8-02', phase:3, day:8, cat:'OPERATOR', title:'Close OD-04 RUZN.AI Manus post-mortem (PRIO-1)', done:false },
  { id:'T3-D9-01', phase:3, day:9, cat:'OPERATOR', title:'Close OD-02 contracts schema set', done:false },
  { id:'T3-D9-02', phase:3, day:9, cat:'OPERATOR', title:'Close OD-03 nahra-v8 reconciliation', done:false },
  { id:'T3-D10-01', phase:3, day:10, cat:'OPERATOR', title:'Close OD-08/09 NanoLM/LionFist briefs', done:false },
  { id:'T3-D14-01', phase:3, day:14, cat:'OPERATOR', title:'Sign Sprint S2 charter', done:false },
  { id:'T3-D21-01', phase:3, day:21, cat:'CLAUDE', title:'Sprint S2 Week 1: contracts schema committed', done:false },
  { id:'T3-D28-01', phase:3, day:28, cat:'CLAUDE', title:'Sprint S2 Week 2: v0.3.0 tagged', done:false },
  { id:'T3-D29-01', phase:3, day:29, cat:'CLAUDE', title:'Refresh Master Portfolio Status', done:false },
  { id:'T3-D30-01', phase:3, day:30, cat:'OPERATOR', title:'Hand-back briefing with Dr. Jay', done:false }
];

export const SEED_MILESTONES: Milestone[] = [
  { id:'M-00',  day:0,  title:'Pre-flight confirmed', criterion:'Subscriptions verified; folder created; references read', closed:true },
  { id:'M-1.1', day:1,  title:'Local evidence complete', criterion:'CH-1 report filed; dispatch log updated', closed:false },
  { id:'M-1.2', day:1,  title:'GitHub truth + sprint verification', criterion:'CH-2 report filed; S0/S1 closure answered', closed:false },
  { id:'M-1.3', day:1,  title:'Engineering memory extracted', criterion:'CH-3 Pass A + B reports filed', closed:false },
  { id:'M-1.4', day:2,  title:'External truth established', criterion:'CH-4 Pass A + B reports filed; URLs verified', closed:false },
  { id:'M-1.5', day:2,  title:'Drafting/tooling recall captured', criterion:'CH-5 reports filed', closed:false },
  { id:'M-1.6', day:3,  title:'Manus forensic adjudicated', criterion:'CH-6 released or BLOCKED', closed:false },
  { id:'M-1.0', day:3,  title:'Phase 1 complete', criterion:'All channels reported; dispatch log full', closed:false },
  { id:'M-2.0', day:7,  title:'Fusion complete', criterion:'Matrix >= 80 rows; conflicts >= 90% closed; scoring done', closed:false },
  { id:'M-3.1', day:10, title:'Owner arbitration complete', criterion:'>= 8 of 13 decisions closed', closed:false },
  { id:'M-3.2', day:14, title:'Sprint S2 charter signed', criterion:'Charter in 05-final-artefacts', closed:false },
  { id:'M-3.3', day:21, title:'Sprint S2 Week 1 closed', criterion:'Contracts schema committed; doctrine repo live', closed:false },
  { id:'M-3.4', day:28, title:'Sprint S2 Week 2 closed', criterion:'v0.3.0 tagged', closed:false },
  { id:'M-3.0', day:30, title:'Exploitation complete', criterion:'Refresh done; dashboard live; hand-back briefed', closed:false }
];

export const SEED_KPIS: Kpi[] = [
  { id:'K-01', phase:0, name:'Subscriptions accessible', target:'9 of 9', value:'9', source:'Phase 0 verification' },
  { id:'K-02', phase:1, name:'Channels dispatched and returned', target:'6 of 6', value:'0', source:'Dispatch log' },
  { id:'K-03', phase:1, name:'Cross-channel conflicts logged', target:'>= 10', value:'0', source:'Conflicts sheet' },
  { id:'K-04', phase:1, name:'Live URLs verified', target:'7 of 7', value:'0', source:'CH-4 Pass B' },
  { id:'K-05', phase:1, name:'Sprint S0 closure answered', target:'Yes', value:'pending', source:'CH-2' },
  { id:'K-06', phase:1, name:'Sprint S1 closure answered', target:'Yes', value:'pending', source:'CH-2' },
  { id:'K-07', phase:1, name:'Manus residue scan verdict', target:'Issued', value:'pending', source:'CH-6 + security-auditor' },
  { id:'K-08', phase:2, name:'Matrix rows populated', target:'>= 80', value:'30', source:'Master_Matrix' },
  { id:'K-09', phase:2, name:'Conflicts resolved (no arbitration)', target:'>= 90%', value:'0%', source:'Conflicts sheet' },
  { id:'K-10', phase:2, name:'Strategic scores computed', target:'100%', value:'0%', source:'Master_Matrix' },
  { id:'K-11', phase:3, name:'Owner decisions closed', target:'>= 8 of 13', value:'0 of 13', source:'Open_Decisions' },
  { id:'K-12', phase:3, name:'Sprint S2 tagged v0.3.0', target:'Yes', value:'pending', source:'GitHub releases' },
  { id:'K-13', phase:3, name:'acuterium-contracts STUB -> FILLED', target:'Yes', value:'pending', source:'Contracts repo' },
  { id:'K-14', phase:3, name:'acuterium-doctrine repo live', target:'Yes', value:'pending', source:'GitHub' },
  { id:'K-15', phase:3, name:'nahra-v8 Section 0 reconciled', target:'Yes', value:'pending', source:'nahra-v8 main' },
  { id:'K-16', phase:3, name:'RUZN.AI Manus residue zero', target:'Verified', value:'pending', source:'security-auditor' },
  { id:'K-17', phase:3, name:'ZURD AcuKey on GitHub', target:'Yes', value:'pending', source:'New repo' },
  { id:'K-18', phase:3, name:'Live-surface first announcement', target:'Yes', value:'pending', source:'Announcement registry' },
  { id:'K-19', phase:3, name:'Master Project Dashboard published', target:'Yes', value:'Stage 2 live', source:'Sovereign surface' },
  { id:'K-20', phase:3, name:'Master Portfolio Status refreshed', target:'Yes', value:'pending', source:'05-final-artefacts' }
];
