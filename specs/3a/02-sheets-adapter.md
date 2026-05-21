# Spec 3a.02 · Google Sheets Adapter

**Sub-phase:** 3a
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved for implementation
**Estimated time:** 60 min

---

## Why

Current build hardcodes 18 static TypeScript data files in `src/data/*.ts`. The dashboard's config card claims "Google Sheets backing active · 30s sync" but no Sheets adapter exists. Operator wants to update task/KPI/OD state by editing a Google Sheet (and later via a UI write-back form in Phase 3b). This spec lands the read + write adapter.

## Out of scope (Phase 3b+)

- Write-back form UI drawer (Phase 3b — needs BI grid first)
- Multi-tenant Sheets (one sheet per operator)
- Sheets webhook for instant push (current: 30s polling)

## Authentication

Use a **Google Cloud service account** with the Sheets API enabled. Operator creates one and shares the target sheet with the service account's email (read+write access).

Three env vars:

| Name | Purpose |
|---|---|
| `GOOGLE_SHEET_ID` | Spreadsheet ID (from URL: `docs.google.com/spreadsheets/d/<ID>/...`) |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account email (`xxx@yyy.iam.gserviceaccount.com`) |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Service account private key (PEM, newlines escaped as `\\n`) |

If any env var is missing, the adapter **must fall back gracefully to the static `src/data/*.ts` files** with a console warning. The dashboard must boot and render even with no Sheets configured.

## Sheet schema (tabs the adapter reads)

| Tab name | Columns (first row = header) | Maps to |
|---|---|---|
| `tasks` | `id, phase, day, cat, title, done, completedAt, blockedBy` | `Task[]` |
| `milestones` | `id, title, phase, day, criterion, status` | `Milestone[]` |
| `decisions` | `id, item, need, blocking, rec, status, priority` | `Decision[]` |
| `kpis` | `id, name, source, target, value, state` | `KPI[]` |
| `channels` | `id, name, surface, access, coverage, status, output, conflicts, note, residueVerdict` | `Channel[]` |
| `portfolio` | `id, name, type, product, layer, status, confidence, sensitivity, channels, action, ownerDecision` | `PortfolioRow[]` |
| `surfaces` | `name, url, host, announce, residue, action` | `Surface[]` |
| `conflicts` | `id, topic, srcA, srcB, desc, resolution, status` | `Conflict[]` |
| `spine` | `repo, layer, purpose, state, action, od` | `SpineRow[]` |
| `sprints` | `id, range, scope, status, tag, verify` | `Sprint[]` |

Type contracts already exist in `src/data/types.ts` — Sheets adapter must produce objects matching those types exactly.

## Implementation files

### `src/lib/sheets/client.ts`

```typescript
import { google, sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets | null {
  if (cachedClient) return cachedClient;

  const { GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY } = process.env;
  if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY) {
    console.warn('[sheets] credentials not set · static fallback active');
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SHEETS_CLIENT_EMAIL,
    key: GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}
```

### `src/lib/sheets/read.ts`

```typescript
import { getSheetsClient } from './client';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function readSheetTab<T>(tabName: string, headerMap: (row: string[]) => T): Promise<T[] | null> {
  const client = getSheetsClient();
  if (!client || !SHEET_ID) return null;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = response.data.values ?? [];
    if (rows.length < 2) return [];

    return rows.slice(1).map(headerMap).filter(Boolean);
  } catch (err) {
    console.error(`[sheets] read ${tabName} failed`, err);
    return null;
  }
}
```

### `src/lib/sheets/parsers.ts`

One parser per tab, mapping raw row arrays to typed objects. Example for tasks:

```typescript
import type { Task } from '../../data/types';

export function parseTaskRow(row: string[]): Task | null {
  const [id, phase, day, cat, title, done, completedAt, blockedBy] = row;
  if (!id || !title) return null;
  return {
    id,
    phase: Number(phase) || 0,
    day: Number(day) || 0,
    cat: (cat as Task['cat']) ?? 'OPERATOR',
    title,
    done: done === 'TRUE' || done === 'true' || done === '1',
    completedAt: completedAt || undefined,
    blockedBy: blockedBy || undefined,
  };
}
```

Repeat for milestones, decisions, kpis, channels, portfolio, surfaces, conflicts, spine, sprints.

### `src/hooks/useSheetsData.ts`

```typescript
import { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

export function useSheetsData<T>(tabName: string, fallback: T[]): { data: T[]; loading: boolean; fromSheets: boolean } {
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [fromSheets, setFromSheets] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(`/api/sheets/read?tab=${encodeURIComponent(tabName)}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          if (!cancelled) { setLoading(false); }
          return;
        }
        const json = await response.json();
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data);
          setFromSheets(true);
        }
        setLoading(false);
      } catch (err) {
        console.warn(`[useSheetsData] ${tabName} fetch failed, using fallback`, err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [tabName]);

  return { data, loading, fromSheets };
}
```

### `app/api/sheets/read/route.ts`

Read endpoint — bearer-cookie auth, no CWH gate needed (read-only).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSheetTab } from '@/src/lib/sheets/read';
import * as parsers from '@/src/lib/sheets/parsers';

const TAB_PARSERS: Record<string, (row: string[]) => unknown> = {
  tasks: parsers.parseTaskRow,
  milestones: parsers.parseMilestoneRow,
  decisions: parsers.parseDecisionRow,
  kpis: parsers.parseKpiRow,
  channels: parsers.parseChannelRow,
  portfolio: parsers.parsePortfolioRow,
  surfaces: parsers.parseSurfaceRow,
  conflicts: parsers.parseConflictRow,
  spine: parsers.parseSpineRow,
  sprints: parsers.parseSprintRow,
};

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get('acuterium-access');
  if (!cookie) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const tab = req.nextUrl.searchParams.get('tab');
  if (!tab || !(tab in TAB_PARSERS)) {
    return NextResponse.json({ error: 'invalid tab' }, { status: 400 });
  }

  const data = await readSheetTab(tab, TAB_PARSERS[tab]);
  if (data === null) {
    return NextResponse.json({ error: 'sheets unavailable', fallback: true }, { status: 503 });
  }
  return NextResponse.json({ data });
}
```

### `app/api/sheets/update/route.ts`

Write endpoint — bearer-cookie auth + **CWH gate** (reuses the Phase 2 evaluator).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { evaluateCWH } from '@/src/lib/cwh/evaluate';
import { appendAudit } from '@/src/lib/cwh/auditlog';
import { writeSheetCell } from '@/src/lib/sheets/write';
import { z } from 'zod';

const UpdateRequestSchema = z.object({
  target: z.enum(['task-update', 'kpi-update', 'od-update', 'milestone-update', 'residue-update', 'surface-update']),
  targetId: z.string(),
  field: z.string(),
  newValue: z.string(),
  actor: z.object({
    session: z.string(),
    pathos: z.object({
      stress: z.number().min(0).max(100),
      focus: z.number().min(0).max(100),
      curiosity: z.number().min(0).max(100),
      fatigue: z.number().min(0).max(100),
      satisfaction: z.number().min(0).max(100),
    }),
  }),
  context: z.object({
    kairosMode: z.enum(['AUI', 'HUD', 'TUUI', 'GUI', 'Dashboard', 'Ambient']),
    doctrineScore: z.number().min(0).max(100),
  }),
});

export async function POST(req: NextRequest) {
  const cookie = (await cookies()).get('acuterium-access');
  if (!cookie) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', details: parsed.error.flatten() }, { status: 400 });

  // Reuse Phase 2 CWH evaluator with target mapped to base target (task-update → task etc.)
  const baseTarget = parsed.data.target.replace('-update', '') as 'task' | 'kpi' | 'od' | 'milestone' | 'residue' | 'surface';
  const verdict = evaluateCWH({
    target: baseTarget,
    targetId: parsed.data.targetId,
    fromState: '(read)',
    toState: parsed.data.newValue,
    actor: parsed.data.actor,
    context: parsed.data.context,
  });

  const audit = await appendAudit(parsed.data, verdict);

  if (verdict.verdict === 'deny') {
    return NextResponse.json({ verdict: 'deny', reason: verdict.reason, ruleId: verdict.ruleId, auditId: audit.auditId }, { status: 200 });
  }

  // Write to Sheets
  const writeResult = await writeSheetCell(baseTarget, parsed.data.targetId, parsed.data.field, parsed.data.newValue);
  if (!writeResult.ok) {
    return NextResponse.json({ error: 'sheets write failed', auditId: audit.auditId }, { status: 502 });
  }

  return NextResponse.json({ verdict: 'allow', ruleId: verdict.ruleId, auditId: audit.auditId });
}
```

### `src/lib/sheets/write.ts`

```typescript
import { getSheetsClient } from './client';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const HEADER_CACHE: Record<string, string[]> = {};

async function getHeaderRow(tab: string): Promise<string[]> {
  if (HEADER_CACHE[tab]) return HEADER_CACHE[tab];
  const client = getSheetsClient();
  if (!client || !SHEET_ID) return [];

  const response = await client.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:Z1`,
  });
  const headers = (response.data.values?.[0] ?? []) as string[];
  HEADER_CACHE[tab] = headers;
  return headers;
}

export async function writeSheetCell(
  tab: string,
  id: string,
  field: string,
  newValue: string
): Promise<{ ok: boolean; reason?: string }> {
  const client = getSheetsClient();
  if (!client || !SHEET_ID) return { ok: false, reason: 'sheets not configured' };

  try {
    const headers = await getHeaderRow(tab);
    const idCol = headers.indexOf('id');
    const fieldCol = headers.indexOf(field);
    if (idCol === -1 || fieldCol === -1) return { ok: false, reason: 'column not found' };

    // Find row by id
    const idRange = `${tab}!${columnLetter(idCol)}:${columnLetter(idCol)}`;
    const idResponse = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: idRange,
    });
    const ids = idResponse.data.values ?? [];
    const rowIndex = ids.findIndex(r => r[0] === id);
    if (rowIndex === -1) return { ok: false, reason: 'id not found in sheet' };

    // Row index is 0-based but Sheets is 1-based + header offset
    const cellRange = `${tab}!${columnLetter(fieldCol)}${rowIndex + 1}`;

    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newValue]] },
    });
    return { ok: true };
  } catch (err) {
    console.error('[sheets:write] failed', err);
    return { ok: false, reason: String(err) };
  }
}

function columnLetter(index: number): string {
  let s = '';
  let i = index;
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}
```

## Doctrinal red-lines

- Sheets adapter MUST gracefully degrade to static `src/data/*.ts` if any env var is missing
- Write endpoint MUST go through the Phase 2 CWH evaluator (same 12 rules)
- Write endpoint MUST write to AuditLog whether or not the Sheets call succeeds
- No PII / no operator email / no service account key value ever appears in any AuditLog entry, error response, or client-side JS
- Service account private key MUST be read from env, never committed
- Read endpoint MUST be bearer-cookie auth-gated (not public — sheets may contain sensitive operator data)
- Polling MUST respect `document.visibilitychange` — pause polling when tab is hidden

## Tests (Vitest)

`src/lib/sheets/sheets.test.ts`:

1. Parser produces correct object shape from canonical row
2. `getSheetsClient()` returns `null` when env vars unset
3. `readSheetTab()` returns `null` (not throws) on API failure
4. `writeSheetCell()` correctly maps id+field to A1 notation
5. Polling hook respects `document.visibilitychange`
6. CWH gate denies a Sheets write when stress > 90
7. Failed Sheets write still produces an AuditLog entry (with verdict=allow but `error: 'sheets write failed'`)
8. Fallback path: with env vars unset, `useSheetsData(fallback)` returns the fallback

## Acceptance criteria

- [ ] All 8 Vitest assertions pass
- [ ] Setting all 3 env vars + sharing a test sheet → dashboard reads live data
- [ ] Unsetting any env var → dashboard renders with static data + console warning (no crash)
- [ ] `/api/sheets/update` denies stress > 90 (same CWH rules as Phase 2)
- [ ] Update to `tasks.done = true` from API reflects in sheet within 1 second
- [ ] Polling pauses when tab hidden (verified via DevTools throttling)
- [ ] Bundle delta < +30 kB first-load (googleapis is heavy but tree-shakes well; if it doesn't, swap to a lightweight Sheets v4 wrapper)
- [ ] Service account private key NEVER appears in build output, browser bundle, or error response
