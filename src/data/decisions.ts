import type { Decision } from './types';

/**
 * 13 owner decisions (OD-01 .. OD-13).
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 734-748.
 */
export const DECISIONS: Decision[] = [
  {id:'OD-01',item:'acuterium-doctrine repo',need:'Approve creation as L0 home for 7-Layer Doctrine v2',blocking:'Doctrine v2 commit',rec:'Approve; Claude scaffolds repo',status:'open'},
  {id:'OD-02',item:'acuterium-contracts schema set',need:'Approve matrix/judge/orchestrate/route/ASIP envelope/TokenBridge JWT',blocking:'Every L2+ repo',rec:'Approve; Claude drafts OpenAPI 3.1 + JSON Schema',status:'open'},
  {id:'OD-03',item:'nahra-v8 Section 0 reconciliation',need:'Approve switch to Diaran-AI honest attribution',blocking:'NAHRĀ launch',rec:'Approve; replace forbidden-names language',status:'open'},
  {id:'OD-04',item:'RUZN.AI Manus residue post-mortem',need:'PRIO-1: sign off after CH-6 residue scan',blocking:'RUZN.AI any further work',rec:'CH-6 quarantine + security-auditor; review; sign',status:'open',priority:'PRIO-1'},
  {id:'OD-05',item:'Live-surface announcement plan',need:'Decide timing/order for 7 surfaces',blocking:'Public credibility',rec:'Coordinated launch after fusion lock',status:'open'},
  {id:'OD-06',item:'AMARA migration target',need:'Choose target stack (sovereign)',blocking:'AMARA sovereignty',rec:'Acuterium-Local + ACAI V2',status:'open'},
  {id:'OD-07',item:'ZURD AcuKey GitHub migration',need:'Approve repo name + migration',blocking:'Hardware launch line',rec:'acuterium-zurd-acukey repo',status:'open'},
  {id:'OD-08',item:'NanoLM product brief',need:'Provide product brief',blocking:'Hardware launch line',rec:'Owner elicitation + CH-3/4 context',status:'open'},
  {id:'OD-09',item:'LionFist product brief',need:'Provide product brief',blocking:'Hardware launch line',rec:'Owner elicitation + CH-3/4 context',status:'open'},
  {id:'OD-10',item:'Edna shard mapping',need:'Confirm Erebus-CSE primary · Qareen-OSINT E-03 secondary',blocking:'Edna product launch',rec:'Confirm; rename HuHud→Edna; add to registry',status:'open'},
  {id:'OD-11',item:'Skill count reconciliation',need:'Reconcile 4,122 vs 4,535',blocking:'Skill registry integrity',rec:'CH-2 reads canonical CSV',status:'open'},
  {id:'OD-12',item:'License choice for public repos',need:'Choose LICENSE for 6 repos',blocking:'Anthropic review',rec:'Apache-2.0 (code) · CC-BY-NC-4.0 (proprietary docs)',status:'open'},
  {id:'OD-13',item:'Manus-as-Tier-1 vs quarantine',need:'Reconcile policy',blocking:'Manus dispatch',rec:'Tier-1 for retrieval · Quarantine for residue',status:'open'},
];
