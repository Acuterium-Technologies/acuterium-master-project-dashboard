import type { Channel } from './types';

/**
 * 6 dispatch channels — operator + AI surface registry.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 614-621.
 */
export const CHANNELS: Channel[] = [
  {id:'CH-1',name:'Claude Code VSCode',surface:'VSCode extension',access:'Local FS · shell · git',coverage:'Local matrix population · OneDrive · ZURD firmware',status:'queued',output:'reports/CH1-local-{date}.md',conflicts:0},
  {id:'CH-2',name:'Claude Code Web',surface:'claude.ai/code',access:'GitHub connector + threads + memory',coverage:'Repo deep-read · Sprint S0/S1 closure · skill count · contracts',status:'ACTIVE',output:'reports/CH2-github-threads-{date}.md',conflicts:0},
  {id:'CH-3',name:'claude.ai chat',surface:'claude.ai',access:'Memory + conversation_search',coverage:'ACAI V2 · NAHRĀ · skills · hardware prior context',status:'queued',output:'reports/CH3-claude-memory-{date}.md',conflicts:0},
  {id:'CH-4',name:'Perplexity + Comet',surface:'perplexity.ai',access:'Live web · threads · agentic verify',coverage:'Live URLs · model licensing · DNS · SSL',status:'ARCHIVED',output:'reports/CH4-perplexity-{date}.md',conflicts:0,note:'CH-4 BUNDLE_READY (23 P-dossiers + appendices)'},
  {id:'CH-5',name:'ChatGPT',surface:'chatgpt.com',access:'Memory + Projects',coverage:'Drafting · Python tooling · custom GPTs · AMARA stopgap',status:'DISPATCHED',output:'reports/CH5-chatgpt-{date}.md',conflicts:0},
  {id:'CH-6',name:'Manus (QUARANTINE)',surface:'Manus AI',access:'Agentic execution',coverage:'Forensic reconstruction · residue scan',status:'quarantine',output:'reports/quarantine/CH6-manus-{date}.md',conflicts:0,residueVerdict:null,note:'Quarantine — release blocked until security-auditor scan = CLEAN'},
];
