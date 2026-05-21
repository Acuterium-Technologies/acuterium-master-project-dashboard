import type { Stage2Step } from './types';

/**
 * Stage 2 — 13-step deployment workflow.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 799-813.
 */
export const STAGE2: Stage2Step[] = [
  {id:'S2-01',title:'Local scaffolding extract & install',sub:['Extract acuterium-master-project-dashboard.zip','Remove app/api/audit empty folder','Verify 30 files via tree report','npm ci']},
  {id:'S2-02',title:'Google Sheet creation',sub:['Create blank sheet ACU-Master-Project-Dashboard-Data','Rename tabs: Matrix · Tasks · Milestones · KPIs · AuditLog','Extract 44-char SHEET_ID from URL','Transmit SHEET_ID to Claude Code']},
  {id:'S2-03',title:'GCP service account configuration',sub:['Create project: acuterium-master-project','Enable Sheets API · Drive API','Create service account: master-project-sheet-writer','Generate JSON key; download securely']},
  {id:'S2-04',title:'Service account JSON to ENV',sub:['Base64-encode JSON','Set GOOGLE_SERVICE_ACCOUNT_JSON in .env.local','Share sheet with service-account email (Editor)','Verify sheet writes via lib/sheets.ts test']},
  {id:'S2-05',title:'Seed data initialisation',sub:['Run lib/seed.ts','Confirm 28 matrix · 50 tasks · 14 milestones · 20 KPIs','Verify in Google Sheets tabs']},
  {id:'S2-06',title:'Vercel project creation (AMAD projects team)',sub:['Login to Vercel via AMAD account','Import repo from Acuterium-Technologies org','Set framework: Next.js · root: /','Add all env vars from .env.local']},
  {id:'S2-07',title:'ENV-2 implementation (production env vars)',sub:['Add GOOGLE_SHEET_ID (44 chars)','Add GOOGLE_SERVICE_ACCOUNT_JSON (base64)','Add NEXTAUTH_SECRET (32 bytes random)','Add SENTRY_DSN · NEXT_PUBLIC_SENTRY_DSN']},
  {id:'S2-08',title:'First Vercel deploy',sub:['Push to main; wait for build green','Verify *.vercel.app domain returns 200','Smoke-test seed data via /api/sheets','Confirm Sentry receives synthetic error']},
  {id:'S2-09',title:'Sentry observability activation',sub:['Confirm @sentry/nextjs pinned 8.42.0','Verify sentry.client/server/edge.config.ts','Set sample rate 1.0 (campaign-window)','Replay session enabled']},
  {id:'S2-10',title:'Password-protected access gate',sub:['Add middleware.ts with bcrypt-hashed PASSWORD','Set PASSWORD env in Vercel','Verify HTTP 401 on unauth · 200 after auth','Test from incognito']},
  {id:'S2-11',title:'DNS — master-project.acuterium.ai',sub:['Add CNAME master-project → cname.vercel-dns.com','Vercel domain attach + auto-SSL','Wait for HTTPS green (≤ 10 min)','Curl 200 from external network']},
  {id:'S2-12',title:'Vercel Analytics activation',sub:['Enable Analytics in Vercel project settings','Confirm @vercel/analytics in app/layout.tsx','Verify Analytics events recorded','30s polling alive on dashboard']},
  {id:'S2-13',title:'Final verification + credentials cleanup',sub:['Run smoke test on all 4 tabs','Confirm 28 matrix · 50 tasks · 14 milestones · 20 KPIs','Delete DEPLOYMENT-CREDENTIALS.md','Rotate any exposed secrets','Sign Stage-2-complete event']},
];
