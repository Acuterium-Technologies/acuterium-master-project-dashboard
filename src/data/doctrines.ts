import type { Doctrine } from './types';

/**
 * 12 Sovereign Doctrines (D-01 .. D-12).
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 870-963.
 *
 * Doctrinal red line: doctrine `id` and `classKey` values are LOCKED and
 * referenced by external scoring + UI rendering. Do not rename or remove
 * either field. Identifier diacritics (Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI
 * · M-PCB) are part of the brand canon and must be preserved verbatim.
 */
export const DOCTRINES: Doctrine[] = [
  {id:'D-01', name:'M-PCB Doctrine', short:'Outcomes Over Algorithms', classKey:'sovereign',
   tag:'Sovereignty · publication discipline',
   summary:'"We publish outcomes, not algorithms. Data sovereignty is our moat." Governs every external publication, partnership briefing, and investor deck.',
   principles:[
    'P1 · Outcomes are public-facing; algorithms remain sovereign assets.',
    'P2 · Provider attribution must be honest — never anonymised.',
    'P3 · Data residency must align with Acuterium domicile or sovereign-region equivalent.',
    'P4 · No external service stores Sovereign-class data without explicit M-PCB review.',
   ]},
  {id:'D-02', name:'PSI Dominion', short:'Sovereign Information Operations', classKey:'psi',
   tag:'SIOPS · Edna · Qareen · MADA',
   summary:'Sovereign control of the information environment surrounding Acuterium and the Sultanate. Edna (SIGINT), Qareen (OSINT), MADA (domain awareness), and ACU-SIOPS-001 form the active layer.',
   principles:[
    'P1 · SIGINT collection routes through Edna · Erebus-CSE primary · Qareen-OSINT E-03 secondary.',
    'P2 · Strategic narrative framing precedes every public announcement.',
    'P3 · MADA maintains continuous domain awareness across maritime + land + cyber.',
    'P4 · No SIOPS material leaves the sovereign perimeter unsigned by the operator.',
   ]},
  {id:'D-03', name:'RUZN Dominion', short:'Legal Authority Chain', classKey:'ruzn',
   tag:'Omani law · GCC jurisprudence · Ajraam W-02',
   summary:'Sovereign legal authority. RUZN.AI is the operator-facing surface; Ajraam (W-02) is the engine; the chain runs from Omani statute → GCC jurisprudence → ASIP v2 envelope → RUZN judgement.',
   principles:[
    'P1 · Every legal output carries Ajraam W-02 attribution + ASIP envelope.',
    'P2 · No legal answer is shipped without the Omani-statute citation when applicable.',
    'P3 · Arabic RTL mandatory on judicial surfaces; bilingual EN/AR for government-facing.',
    'P4 · Manus residue purge is prerequisite for any further RUZN.AI work (Golden Rule #4).',
   ]},
  {id:'D-04', name:'Hybrid Persuasive Tech', short:'Strategic Psychological Framing', classKey:'persuasive',
   tag:'Arbitration · Anthropic · Investor',
   summary:'Persuasion architecture for high-stakes interactions: owner arbitration, Anthropic partnership conversations, investor decks, government engagement. The framing precedes the content.',
   principles:[
    'P1 · Arbitration opens with the decision asked, the recommended path, the cost of inaction — in that order.',
    'P2 · Anthropic briefings lead with operational discipline evidence, never feature lists.',
    'P3 · Investor decks present the moat (data sovereignty) before the product.',
    'P4 · Government engagement emphasises sovereign benefit + ICV alignment + Omani-domicile.',
    'P5 · Every frame terminates in a single decision request.',
   ]},
  {id:'D-05', name:'CWH Governance', short:'Consciousness Welfare & Harmony', classKey:'cwh',
   tag:'Ethical gate · state transitions',
   summary:'The ethical constraint framework. Every ASI operation, every state transition in this dashboard, must clear the CWH gate. The gate is enforcement, not advice.',
   principles:[
    'P1 · No operator override of CH-6 quarantine without explicit BLOCKED → review → unblock.',
    'P2 · No milestone closure without verifiable closure-criterion evidence.',
    'P3 · No owner decision closure without recorded resolution path.',
    'P4 · Every transition writes to AuditLog with actor + timestamp + before/after.',
    'P5 · Non-compliant transitions are denied at the gate; user is informed via CWH toast.',
   ]},
  {id:'D-06', name:'ASIP v2', short:'Acuterium Soul Infusion Protocol', classKey:'compliant',
   tag:'Identity · ethics · sovereignty',
   summary:'Every agent, shard, surface, and deployed service must carry Acuterium identity, ethics, and sovereignty markers. Non-negotiable.',
   principles:[
    'P1 · ASIP envelope on every record.',
    'P2 · Outputs missing the envelope are wrapped before persistence.',
    'P3 · Version pinned; bumps require master-database commit.',
   ]},
  {id:'D-07', name:'TokenBridge', short:'Three-Token Authorization', classKey:'compliant',
   tag:'ACT · INT · CON',
   summary:'Action rights (ACT), Intelligence access (INT), Consciousness governance (CON) — all three verified on the CDMA blockchain before execution proceeds.',
   principles:[
    'P1 · No execution proceeds without full ACT · INT · CON clearance.',
    'P2 · Token clearance recorded per state transition.',
    'P3 · Live dashboard runs in ACT=true INT=true CON=true mode.',
   ]},
  {id:'D-08', name:'Naming Canon', short:'23 Locked Spellings', classKey:'compliant',
   tag:'Lint · enforcement · master-database',
   summary:'23 canonical forms enforced at CI lint + UI input. Variant spellings are auto-corrected during ingestion. Master-database forms with diacritics are canonical.',
   principles:[
    'P1 · Mārel, NAHRĀ, ZemarōnOS, Finariah-ASI — diacritics mandatory.',
    'P2 · Public repo names lowercase-hyphenated; internal shard codes ALL-CAPS.',
    'P3 · AcuTect-CODEX hyphenated; underscore form is GitHub-legacy.',
    'P4 · Variant input surfaces as lint warning; CI blocks on canonical violation.',
   ]},
  {id:'D-09', name:'Manus Quarantine', short:'Golden Rule #4', classKey:'sovereign',
   tag:'CH-6 · residue scan · fusion gate',
   summary:'CH-6 Manus output sits in a structurally isolated quarantine. Fusion merge is impossible until security-auditor residue scan returns CLEAN.',
   principles:[
    'P1 · CH-6 lands in 02-reports-raw/CH-6-manus-QUARANTINE/ exclusively.',
    'P2 · Residue scan verdict ∈ {NOT-RUN, CLEAN, FLAGGED, BLOCKED}.',
    'P3 · BLOCKED → operator arbitration required; never auto-released.',
    'P4 · RUZN.AI Manus Purge PR #8 must verify CLEAN before any further RUZN.AI work (OD-04).',
   ]},
  {id:'D-10', name:'Provider Attribution', short:'Diaran-AI Honest Stance', classKey:'compliant',
   tag:'Every cell · every output',
   summary:'When an analytical output appears in the dashboard or in a deployed surface, the source AI is named: model, timestamp, orchestration context.',
   principles:[
    'P1 · source_channels[] populated on every Master_Matrix row.',
    'P2 · generated_by{model,ts} on every Claude-authored output.',
    'P3 · nahra-v8 Section 0 must align with Diaran-AI stance (OD-03).',
   ]},
  {id:'D-11', name:'7-Layer Doctrine v2', short:'L0 → L6 Architecture', classKey:'compliant',
   tag:'Sovereignty stack · master-database',
   summary:'L0 Sovereignty · L1 Contracts · L2 Orchestration · L3 Routing · L4 Inference · L5 Output Discipline · L6 Surface. Each layer has owner + canonical state.',
   principles:[
    'P1 · L0 lives in acuterium-doctrine repo (to be created · OD-01).',
    'P2 · L1 contracts schema fill is the highest-leverage gap (OD-02).',
    'P3 · L6 surfaces inherit L0 + L1 + L5 before launch.',
   ]},
  {id:'D-12', name:'M-00 → M-3.0 State Machine', short:'14-Milestone Closure Discipline', classKey:'compliant',
   tag:'Closure criteria · operator-signed',
   summary:'14 milestones with verifiable closure criteria. No milestone advances without operator confirmation. State machine is the campaign\'s ground truth.',
   principles:[
    'P1 · Each milestone has an explicit closure criterion (Playbook Appendix C).',
    'P2 · Cowork never auto-advances; the operator signs.',
    'P3 · Closed milestones are tamper-evident in AuditLog.',
   ]},
];
