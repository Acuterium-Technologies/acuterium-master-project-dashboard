import type { Surface } from './types';

/**
 * 7 live surfaces (state plus residue posture per surface).
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 765-773.
 */
export const SURFACES: Surface[] = [
  {name:'acuterium.ai',url:'https://acuterium.ai',host:'Vercel',announce:'unannounced',residue:'low',action:'CH-4 verify; announcement decision'},
  {name:'StratEDGE',url:'stratedge.acuterium.ai (assumed)',host:'Vercel',announce:'unannounced',residue:'low',action:'CH-4 URL + DNS verify'},
  {name:'Mārel',url:'unknown',host:'Vercel (assumed)',announce:'unannounced',residue:'low',action:'Verify URL; canon lock'},
  {name:'Agent-Oman',url:'https://agent-oman.acuterium.ai',host:'Vercel',announce:'unannounced',residue:'low',action:'CH-4 verify; coordinated launch'},
  {name:'RUZN.AI',url:'https://ruzn.ai (assumed)',host:'Vercel + Railway',announce:'unannounced',residue:'HIGH',action:'MANDATORY: CH-6 + security-auditor scan'},
  {name:'URANA',url:'unknown',host:'Vercel (assumed)',announce:'unannounced',residue:'low',action:'Resolve 3 pre-launch blockers'},
  {name:'AMARA',url:'ChatGPT web (stopgap)',host:'ChatGPT',announce:'STOPGAP',residue:'med',action:'Author migration plan'},
];
