# Mission Zero · KPI Insertion Fix (5 min)

**Background:** Commit `f8e6e34` landed Phase 1A-1E + Phase 2 backfill cleanly, but the PowerShell regex used to insert K-21 (Phase 1E QA) and K-22 (Phase 2 server-side CWH) into `src/data/kpis.ts` failed because the file wraps the `BASE` array in a `.map(seedTrend)` call after the closing `];`.

Verified state via GitHub API at 2026-05-21T10:35Z:
- `src/data/engineering-log.ts` ✅ HAS K-21 + K-22 summaries
- `src/data/kpis.ts` ❌ MISSING K-21 + K-22 entries in BASE array

## Fix

1. Read `src/data/kpis.ts`.
2. Locate the K-20 entry (last KPI before `];`):
   ```typescript
   {id:'K-20',name:'Quarterly refresh cadence',source:'Day 90 scheduled',target:'SCHEDULED',value:'NOT-SCHEDULED',state:'at_risk'},
   ```
3. Append these two entries **immediately after K-20**, inside the BASE array (still inside the `[ ... ];`):
   ```typescript
     {id:'K-21',name:'Phase 1E QA pass rate',source:'Phase-1E-Final-Comprehensive-REPORT',target:'>=95%',value:'100% (48/48)',state:'achieved'},
     {id:'K-22',name:'Phase 2 server-side CWH gate',source:'eND-Phase-2-REPORT',target:'27/27 tests',value:'27/27 + 16/16 preflight + 4/4 smoke',state:'achieved'}
   ```
4. Verify both entries are present in the file via grep.
5. Stage `src/data/kpis.ts`.
6. Commit with this message (write to temp file, use `git commit -F` to avoid shell parsing of multi-line):
   ```
   fix(data): add K-21 Phase 1E QA and K-22 Phase 2 server-side CWH KPIs

   Previous commit f8e6e34 regex failed to match insertion point inside BASE array.
   These KPIs were defined in engineering-log but missing from the KPIS map.

   - K-21: Phase 1E QA pass rate 100 percent (48/48)
   - K-22: Phase 2 server-side CWH gate 27/27 plus 16/16 preflight plus 4/4 smoke

   Closes F-10 from the 2026-05-21 dispatch audit.
   ```
7. Push to `origin main`.
8. Confirm Vercel auto-deploys cleanly.
9. Visit https://master-project.acuterium.ai/master-ops Overview → KPIs, confirm K-21 and K-22 render at the bottom with `achieved` state.

## Acceptance

- [ ] grep `'K-21'` `src/data/kpis.ts` returns 1 hit
- [ ] grep `'K-22'` `src/data/kpis.ts` returns 1 hit
- [ ] Commit lands on `origin/main`
- [ ] Vercel deployment status = Ready within 90s
- [ ] Both KPIs render with green achieved state on the live dashboard

After Mission Zero is complete, proceed to Phase 3a per `specs/3a/README.md`.
