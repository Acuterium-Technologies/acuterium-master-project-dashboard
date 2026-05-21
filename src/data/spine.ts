import type { SpineRow } from './types';

/**
 * Doctrine spine — repo · layer · purpose · state · action · OD.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 784-796.
 */
export const SPINE: SpineRow[] = [
  {repo:'acuterium-doctrine (NEW)',layer:'L0',purpose:'Sovereignty & doctrine — meta-README + canonical repo links',state:'NOT YET CREATED',action:'Create repo; commit 7-Layer Doctrine v2',od:'OD-01'},
  {repo:'acuterium-contracts',layer:'L1',purpose:'OpenAPI / protobuf / JSON schemas',state:'STUB',action:'Fill matrix · judge · orchestrate · route · ASIP envelope · TokenBridge JWT',od:'OD-02'},
  {repo:'Baranurion',layer:'L2',purpose:'Orchestration pipeline (TokenBridge → Q-ARC → ADOCP → ASIP → Q-ENC → CogniMesh)',state:'canonical',action:'CH-2 verify code/README parity; document endpoints',od:'No'},
  {repo:'Diaran-AI',layer:'L3',purpose:'Routing — 18-provider registry · llm-matrix-loader · llm-judge',state:'canonical (v2.0.0, 138/138 tests)',action:'CH-2 re-verify tests + provider list',od:'No'},
  {repo:'Inference providers',layer:'L4',purpose:'Anthropic · OpenAI · Google · Mistral · Cohere · Meta · DeepSeek · Qwen · Falcon · Acuterium-Local',state:'configured per Diaran-AI',action:'Continue Pan Phase 5 Tier-2',od:'No'},
  {repo:'IDRAK',layer:'L5',purpose:'Output discipline — brand masking · ASIP infusion verification · OCF 5-surface routing',state:'Sprint S1 in-flight',action:'Confirm v0.2.0 tag; close S1; document 6 AQUIGGS',od:'No'},
  {repo:'nahra-v8',layer:'L6',purpose:'NAHRĀ Sovereign Browser surface',state:'D-01 doctrine conflict OPEN',action:'Reconcile Section 0 to honest attribution',od:'OD-03'},
  {repo:'acuterium-master-database',layer:'L0',purpose:'Doctrinal canon — protocol catalogue · naming canon · brand registry',state:'canonical v31',action:'Extend ✗/✓ table; CI lint',od:'No'},
  {repo:'acuterium-skills-marketplace',layer:'L0/L3',purpose:'Skill registry — v7.0.0',state:'production',action:'Reconcile skill count',od:'OD-11'},
  {repo:'hisn-al-wujud',layer:'sec',purpose:'Defensive stack — ZURD · NyxQ-Net · Erebus-CSE integration',state:'license gap',action:'Add LICENSE/SECURITY',od:'OD-12'},
  {repo:'AcuTect-CODEX',layer:'control-plane',purpose:'Sovereign DevOps + future automation of fusion pipeline',state:'canonical doctrine source',action:'Lock spelling (hyphen); fix folder + repo + refs',od:'No'},
];
