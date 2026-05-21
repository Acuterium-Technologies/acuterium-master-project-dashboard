import type { FutureStage } from './types';

/**
 * Future stages 3 + 4 — Supabase migration · Sovereign self-host.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 852-866.
 */
export const FUTURE: FutureStage[] = [
  {id:'stage-3',name:'Stage 3 — Supabase Migration',ts:'Day 60+',sub:[
    'Stand up Supabase project (eu-central-1, Oman-adjacent)',
    'Apply schema migrations (10 tables matching frozen contracts)',
    'One-time export: Sheets → CSV → Supabase seed',
    'Flip NEXT_PUBLIC_DATA_BACKEND from sheets → supabase',
    'Enable real-time subscriptions (replace 30s polling)',
    'RLS roles: operator (rw) · viewer (r)',
  ]},
  {id:'stage-4',name:'Stage 4 — Sovereign Self-Host',ts:'Day 120+',sub:[
    'Postgres on sovereign-region VPS (Acuterium-controlled)',
    'Baranurion-routed access via acuterium-contracts',
    'CDMA blockchain anchoring of AuditLog',
    'ZURD AcuKey hardware signing for milestone closures',
    'Diaran-AI provider attribution on KPI recompute',
    'Sovereign uptime probes (W-03 Watad)',
  ]},
];
