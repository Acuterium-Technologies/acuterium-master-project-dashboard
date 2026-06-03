import type { KPI } from './types';
import { seedTrend } from '../lib/hooks/seedTrend';

/**
 * 20 KPIs with deterministic 14-day trend series attached.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 655-676.
 *
 * The trend column is derived (not authored), so each reload paints an
 * identical sparkline. Live KPIs ingested from the Sheets tab will
 * override this baseline once Phase 1C wires the row mapping.
 */
const BASE: Omit<KPI, 'trend'>[] = [
  {id:'K-01',name:'Subscriptions accessible',source:'Phase 0 verification',target:'9/9',value:'8/9',state:'on_track'},
  {id:'K-02',name:'Channels dispatched and returned',source:'Dispatch log',target:'6/6',value:'3/6',state:'on_track'},
  {id:'K-03',name:'Cross-channel conflicts logged',source:'Conflicts sheet',target:'>0',value:'10',state:'achieved'},
  {id:'K-04',name:'Live URLs verified',source:'Live_Surfaces',target:'7/7',value:'1/7',state:'at_risk'},
  {id:'K-05',name:'Sprint S0 closure answered',source:'Sprint_Ledger',target:'YES',value:'PENDING',state:'at_risk'},
  {id:'K-06',name:'Sprint S1 closure answered',source:'Sprint_Ledger',target:'YES',value:'PENDING',state:'at_risk'},
  {id:'K-07',name:'Manus residue scan verdict',source:'CH-6 + security-auditor',target:'CLEAN',value:'NOT-RUN',state:'off_track'},
  {id:'K-08',name:'Matrix rows populated',source:'Master_Matrix',target:'≥80',value:'28',state:'on_track'},
  {id:'K-09',name:'Conflicts resolved',source:'Conflicts sheet',target:'≥90%',value:'0%',state:'off_track'},
  {id:'K-10',name:'Owner decisions closed',source:'Open_Decisions',target:'≥8/13',value:'0/13',state:'off_track'},
  {id:'K-11',name:'Top-10 priority queue locked',source:'Phase 2 Day 7',target:'LOCKED',value:'OPEN',state:'at_risk'},
  {id:'K-12',name:'Sprint S2 charter signed',source:'05-final-artefacts',target:'SIGNED',value:'NOT-DRAFTED',state:'at_risk'},
  {id:'K-13',name:'v0.3.0 tagged',source:'GitHub releases',target:'TAGGED',value:'PENDING',state:'at_risk'},
  {id:'K-14',name:'Hardware briefs delivered',source:'06-owner-decisions',target:'3/3',value:'0/3',state:'at_risk'},
  {id:'K-15',name:'Live-surface announcements coordinated',source:'AMAD comms',target:'≥6',value:'0',state:'at_risk'},
  {id:'K-16',name:'Doctrine repo live',source:'GitHub',target:'LIVE',value:'NOT-CREATED',state:'off_track'},
  {id:'K-17',name:'Contracts spine integrated',source:'L1 acceptance',target:'INTEGRATED',value:'STUB',state:'off_track'},
  {id:'K-18',name:'Dashboard published',source:'master-project.acuterium.ai',target:'LIVE',value:'LIVE',state:'achieved'},
  {id:'K-19',name:'Manus quarantine purge verified',source:'CI Manus-free check',target:'CLEAN',value:'PENDING',state:'off_track'},
  {id:'K-20',name:'Quarterly refresh cadence',source:'Day 90 scheduled',target:'SCHEDULED',value:'NOT-SCHEDULED',state:'at_risk'},
  {id:'K-21',name:'Phase 1E QA pass rate',source:'Phase-1E-Final-Comprehensive-REPORT',target:'>=95%',value:'100% (48/48)',state:'achieved'},
  {id:'K-22',name:'Phase 2 server-side CWH gate',source:'eND-Phase-2-REPORT',target:'27/27 tests',value:'27/27 + 16/16 preflight + 4/4 smoke',state:'achieved'},
  // ── Phase C · ACAI-Lab Sandbox KPIs ──
  {id:'K-23',name:'ACAI-Lab build isolation',source:'Bundle-guard test (TC-05.3)',target:'0 KB lab deps in main chunk',value:'NOT-BUILT',state:'off_track'},
  {id:'K-24',name:'Neuro-data consent coverage',source:'TC-01.1 consent gate',target:'opt-in gated + revocable',value:'NOT-BUILT',state:'off_track'},
  {id:'K-25',name:'Affective signal pipeline live',source:'TC-02 webcam + behavioral + replay',target:'LIVE (no headset)',value:'NOT-BUILT',state:'off_track'},
  {id:'K-26',name:'Affective → PATHOS mapping',source:'TC-02.5 PathosDelta fusion',target:'5-axis mapped',value:'NOT-BUILT',state:'off_track'},
  {id:'K-27',name:'In-browser MoE throughput',source:'TC-03 small-MoE WebGPU',target:'>5 tokens/sec',value:'NOT-BUILT',state:'off_track'},
  {id:'K-28',name:'Phase C QA pass rate',source:'TC-05 test suite',target:'>=95%',value:'0%',state:'off_track'},
];

export const KPIS: KPI[] = BASE.map((k) => ({ ...k, trend: seedTrend(k.id, k.target) }));
