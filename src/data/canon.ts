import type { CanonEntry } from './types';

/**
 * 23-entry Naming Canon — canonical spellings + forbidden variants.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 816-840.
 *
 * Diacritics are LOAD-BEARING — they are part of the sovereign brand
 * doctrine (D-08 Naming Canon). Do not strip them.
 */
export const CANON: CanonEntry[] = [
  {cf:'AcuTect-CODEX',forb:'AcuTect_CODEX · AcuTct-CODEX · AcuTeCT'},
  {cf:'Diaran-AI',forb:'Diaran · DIRAAN · DIRAAN-HASAN'},
  {cf:'Mārel',forb:'Marel · MAREL · MAREL-BAYAN'},
  {cf:'NAHRĀ',forb:'Nahra · Nahrā · nahra'},
  {cf:'Finariah-ASI',forb:'Finarah-ASI · Finariah · finariah'},
  {cf:'ZemarōnOS',forb:'ZemaronOS · Zemaron-OS'},
  {cf:'Erebus-CSE',forb:'Erebus · EREBUS · EREBUS-SCOUT'},
  {cf:'StratEDGE',forb:'StratEdge · STRATEDGE · STRATEDGE-BASIRA'},
  {cf:'URANA',forb:'Urana · URANA-DALIL'},
  {cf:'RUZN.AI',forb:'RUZN · Ruzn.ai · Ruzn'},
  {cf:'Edna',forb:'HuHud · Hu-Hud'},
  {cf:'ZURD AcuKey',forb:'Zurd-AcuKey · zurd_acukey · AcuKey'},
  {cf:'NanoLM',forb:'Nano-LM · NANO-LM · nanolm'},
  {cf:'LionFist',forb:'Lion-Fist · LION-FIST · lionfist'},
  {cf:'Acuterium Technologies Inc.',forb:'Acuterium-Tech · Acuterium Tech · ATI'},
  {cf:'Acuterium-Technologies',forb:'acuterium-technologies · Acuterium-Tech (lowercase)'},
  {cf:'Dr. Jalal Saleh Said Al Hadhrami',forb:'Dr. Jay (informal) · Jalal Al Hadhrami'},
  {cf:'M-PCB Doctrine',forb:'MPCB · M PCB'},
  {cf:'CWH governance',forb:'CWH-Governance'},
  {cf:'acuterium-skills-marketplace',forb:'Skills-Marketplace · Acuterium-Skills'},
  {cf:'acuterium-doctrine',forb:'(to be created)'},
  {cf:'acuterium-contracts',forb:'Acuterium-Contracts · contracts'},
  {cf:'acuterium-master-database',forb:'master-db · acuterium-masterdb'},
];
