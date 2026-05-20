# Acuterium Master Project Dashboard

Sovereign portfolio coordination platform for Acuterium Technologies Inc., deployed at `master-project.acuterium.ai`.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Google Sheets as data layer (canonical source of truth)
- Vercel for hosting + Analytics + Speed Insights
- Sentry for error reporting + session replay
- Framer Motion for tab transitions
- Password-gated via Vercel Deployment Protection

## Features

- 4 tabs: Matrix (28 rows), Tasks (52), Milestones (14), KPIs (20)
- Inline edit for KPI values, toggle for tasks and milestones
- Auto-refresh every 30 seconds (reads from sheet)
- Mobile bottom-tab navigation with swipe gestures
- Audit log appended to a 6th sheet on every write
- All writes go through `/api/sheet` server route

## Quick start

See `DEPLOYMENT-GUIDE.md` for the full deployment sequence.

## Project layout

```
app/
  layout.tsx                — Root layout with Analytics/Speed Insights
  page.tsx                  — Server component that reads all data
  globals.css               — Design tokens (ACAI V2 vocabulary)
  api/
    sheet/route.ts          — GET reads all, POST handles updates
    seed/route.ts           — One-time sheet population (Bearer-gated)
components/
  Dashboard.tsx             — Main client component, orchestrates tabs
  Header.tsx                — Top header with sync status
  SummaryBar.tsx            — 5 metric cards
  TabBar.tsx                — Mobile bottom tabs
  MatrixView.tsx            — Filterable matrix grid
  TasksView.tsx             — Phase-filtered task list with toggles
  MilestonesView.tsx        — Vertical timeline with closure ceremony
  KpisView.tsx              — KPI cards with inline editing
lib/
  seed.ts                   — Seed data (28 rows / 52 tasks / 14 milestones / 20 KPIs)
  sheets.ts                 — Google Sheets API client
.github/workflows/
  deploy.yml                — CI pipeline (lint + typecheck on PR)
sentry.*.config.ts          — Sentry init for client/server/edge
DEPLOYMENT-CREDENTIALS.md   — Generated password + env var template (gitignored)
DEPLOYMENT-GUIDE.md         — Step-by-step deployment instructions
```

## Local development

```bash
npm install
cp .env.example .env.local
# Fill .env.local with the same values you'll put in Vercel
npm run dev
```

Visit http://localhost:3000.

## License

Proprietary — Acuterium Technologies Inc. · Muscat, Sultanate of Oman
