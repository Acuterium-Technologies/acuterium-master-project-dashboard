import type { Milestone } from './types';

/**
 * 14 phased milestones (M-00 .. M-3.0).
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 624-639.
 */
export const MILESTONES: Milestone[] = [
  {id:'M-00',title:'Pre-flight confirmed',phase:0,day:0,criterion:'All 9 subscriptions verified · folder structure in place · 3 references read',status:'open'},
  {id:'M-1.1',title:'Local evidence complete',phase:1,day:1,criterion:'CH-1 report filed; JSON evidence rows separated',status:'open'},
  {id:'M-1.2',title:'GitHub truth + sprint verification',phase:1,day:1,criterion:'CH-2 report filed; S0/S1 closure definitively answered',status:'open'},
  {id:'M-1.3',title:'Engineering memory extracted',phase:1,day:1,criterion:'CH-3 Pass A + project Pass Bs filed',status:'open'},
  {id:'M-1.4',title:'External truth established',phase:1,day:2,criterion:'CH-4 Pass A + Pass B Comet verification filed; all URLs labelled',status:'open'},
  {id:'M-1.5',title:'Drafting/tooling recall captured',phase:1,day:2,criterion:'CH-5 Pass A + project Pass Bs filed',status:'open'},
  {id:'M-1.6',title:'Manus forensic adjudicated',phase:1,day:3,criterion:'CH-6 filed in quarantine; residue scan verdict explicit',status:'open'},
  {id:'M-1.0',title:'Phase 1 complete',phase:1,day:3,criterion:'Six channels reported and filed at 100%',status:'open'},
  {id:'M-2.0',title:'Fusion complete · top-10 locked',phase:2,day:7,criterion:'Matrix ≥80 rows · ≥90% conflicts resolved · top-10 ranked and signed',status:'open'},
  {id:'M-3.1',title:'Owner arbitration cycle closed',phase:3,day:10,criterion:'≥8 of 13 decisions closed with signed resolution files',status:'open'},
  {id:'M-3.2',title:'Sprint S2 charter signed',phase:3,day:14,criterion:'Charter signed; in 05-final-artefacts/',status:'open'},
  {id:'M-3.3',title:'v0.3.0 tagged on main',phase:3,day:28,criterion:'Contracts spine integrated; doctrine repo live',status:'open'},
  {id:'M-3.4',title:'Quarterly refresh shipped',phase:3,day:29,criterion:'Refreshed matrix + Master Portfolio Status + ACAI V2 dashboard published',status:'open'},
  {id:'M-3.0',title:'Hand-back complete',phase:3,day:30,criterion:'Day-30 brief delivered; archive locked; next refresh scheduled',status:'open'},
];
