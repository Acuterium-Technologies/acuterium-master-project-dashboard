# Stage Two Deployment Guide

End-to-end instructions to take this scaffolding from your local disk to a live, password-protected dashboard at `master-project.acuterium.ai`.

**Total time estimate:** 4–7 hours for an operator familiar with the tools involved; 6–10 hours if any of GCP/Vercel/DNS is new.

## Pre-deployment checklist (Phase 3a additions)

- [ ] If hero brand surface was touched, hero logo QA guardrail run: [docs/qa/hero-logo-guardrail.md](docs/qa/hero-logo-guardrail.md)
- [ ] If Postgres is provisioned, set `POSTGRES_URL` + `POSTGRES_URL_NON_POOLING` and run `npm run migrate:auditlog` once
- [ ] If Sheets adapter is in use, set `GOOGLE_SHEET_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`
- [ ] For Playwright CI: add `PLAYWRIGHT_TEST_TOKEN` to the GitHub repo secrets (repo-scoped, NOT org-wide), and set the `PLAYWRIGHT_VISUAL_ENABLED=true` repo variable
- [ ] For Blob backup of AuditLog JSONL: set `AUDIT_BLOB_BACKUP_ENABLED=true` and provision `BLOB_READ_WRITE_TOKEN`
- [ ] Bootstrap Playwright baselines locally: `DASHBOARD_ACCESS_TOKEN=<token> npm run test:visual:update` then commit the 5 generated PNG snapshots under `tests/hero-brand.spec.ts-snapshots/`. Required ONLY before first CI run of the visual-regression job.

**Prerequisites before you start:**
- Node.js 20+ installed
- Git installed and `gh auth status` shows you're logged in
- Admin access to the `Acuterium-Technologies` GitHub org
- A Vercel account
- A Google account with permission to create Cloud projects
- Admin access to DNS for `acuterium.ai`

---

## Step 1 — Extract the scaffolding and install (10 min)

```bash
unzip acuterium-master-project-dashboard.zip
cd acuterium-master-project-dashboard
npm install
npm run typecheck
```

The typecheck should pass with no errors. If it fails, stop and report — don't proceed past type errors.

## Step 2 — Create the Google Sheet (15 min)

1. Open https://sheets.google.com → **+ Blank**.
2. Rename the sheet at the top to: `ACU-Master-Project-Dashboard-Data`
3. Create 5 worksheets (tabs at the bottom) with exact names:
   - `Matrix`
   - `Tasks`
   - `Milestones`
   - `KPIs`
   - `AuditLog`
4. Leave them empty. The one-time `/api/seed` call in step 9 will populate them.
5. Copy the sheet ID from the URL. It's the 44-character string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit
   ```
6. Save it. You'll paste it into Vercel as `GOOGLE_SHEET_ID` in step 7.

## Step 3 — Create the Google Cloud service account (30 min)

1. Open https://console.cloud.google.com
2. Create a new project: top bar → project selector → **New Project**
   - Name: `acuterium-master-project`
   - Click Create. Wait for it to provision.
3. With the new project selected, go to **APIs & Services** → **Library**
4. Search for "Google Sheets API" → **Enable**
5. Search for "Google Drive API" → **Enable**
6. Go to **IAM & Admin** → **Service Accounts** → **+ Create Service Account**
   - Name: `master-project-sheet-writer`
   - Description: `Writes to ACU-Master-Project-Dashboard-Data`
   - Click Create.
   - Skip the optional role grant (Sheets permission is granted by sharing the sheet, not via IAM).
   - Click Done.
7. Click the newly created service account → **Keys** tab → **Add Key** → **Create new key** → **JSON** → Create.
8. A JSON file downloads. Keep it secure — it contains the private key.
9. Open the JSON in a text editor. You need two values:
   - `client_email` (looks like `master-project-sheet-writer@acuterium-master-project.iam.gserviceaccount.com`)
   - `private_key` (a long PEM-formatted block starting with `-----BEGIN PRIVATE KEY-----`)
10. **Share the Google Sheet with the service account:**
    - Go back to your sheet (step 2)
    - Click **Share** (top right)
    - Paste the `client_email` value
    - Set permission to **Editor**
    - Uncheck "Notify people" (the service account has no inbox)
    - Click Share.

## Step 4 — Create the GitHub repository (10 min)

```bash
gh repo create Acuterium-Technologies/acuterium-master-project-dashboard \
  --private \
  --description "Sovereign portfolio coordination dashboard at master-project.acuterium.ai"

cd acuterium-master-project-dashboard
git init
git add .
git commit -m "Initial scaffolding from Stage Two delivery"
git branch -M main
git remote add origin git@github.com:Acuterium-Technologies/acuterium-master-project-dashboard.git
git push -u origin main
```

Verify on github.com that the repo exists, is private, and contains the files. `DEPLOYMENT-CREDENTIALS.md` should NOT appear in the repo (it's gitignored).

Invite Dr. Jay as a collaborator:
- Repo → **Settings** → **Collaborators and teams** → **Add people**
- Enter Dr. Jay's GitHub username → role: **Admin** → invite.

## Step 5 — Set up Sentry (20 min)

1. Open https://sentry.io → create account if needed, sign in.
2. **Projects** → **Create Project** → platform: **Next.js**
   - Name: `master-project-dashboard`
   - Team: your default team
   - Click Create Project.
3. After creation, you'll see a setup screen. Note these values:
   - **DSN** (looks like `https://abc123@o123.ingest.sentry.io/456`)
   - **Organization slug** (in the URL: `sentry.io/organizations/SLUG/`)
   - **Project slug** (matches the project name you set)
4. Create an auth token for sourcemap uploads:
   - **Settings** → **Auth Tokens** → **Create New Token**
   - Scopes needed: `project:read`, `project:write`, `org:read`, `project:releases`
   - Copy the token immediately — Sentry shows it only once.

## Step 6 — Create the Vercel project (15 min)

1. Open https://vercel.com → sign in.
2. **Add New** → **Project** → **Import Git Repository**
3. If your GitHub isn't connected yet, connect it. Grant access to the `Acuterium-Technologies` org.
4. Find `acuterium-master-project-dashboard` → **Import**.
5. On the configure screen:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `.` (default)
   - **Do not click Deploy yet.** Open the **Environment Variables** section first (next step).

## Step 7 — Configure environment variables (20 min)

In the Vercel project import screen (or later under **Settings → Environment Variables**), add these one by one. All scoped to **Production, Preview, Development**:

| Key | Value | Source |
|-----|-------|--------|
| `GOOGLE_SHEET_ID` | _the 44-char ID from step 2_ | Google Sheet URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | _the `client_email` value_ | Service account JSON |
| `GOOGLE_PRIVATE_KEY` | _the `private_key` value, full PEM block_ | Service account JSON. Paste the whole thing including BEGIN/END lines. Vercel handles newlines. |
| `SEED_SECRET` | _generate with `openssl rand -base64 24`_ | You |
| `NEXT_PUBLIC_SENTRY_DSN` | _Sentry DSN from step 5_ | Sentry |
| `SENTRY_DSN` | _same DSN as above_ | Sentry |
| `SENTRY_ORG` | _Sentry org slug_ | Sentry |
| `SENTRY_PROJECT` | _Sentry project slug_ | Sentry |
| `SENTRY_AUTH_TOKEN` | _the auth token from step 5_ | Sentry |

After all 9 variables are added, click **Deploy**.

The first deployment takes 2-5 minutes. Watch the build logs. If it fails, check:
- Type errors → `npm run typecheck` locally first
- Missing env vars → re-add and redeploy
- Sentry sourcemap errors → these are non-fatal; the build still succeeds

## Step 8 — Enable password protection (5 min)

1. Once the deployment succeeds, go to **Settings → Deployment Protection**.
2. Under **Vercel Authentication**, switch to **Password Protection**.
3. Enable for **Production** (and Preview if you want).
4. Set the password to the one in `DEPLOYMENT-CREDENTIALS.md`:
   ```
   CMx%y_Z@fk5N-+I%6-r8Sa41UqZE
   ```
5. Save.
6. Visit your Vercel-assigned URL (something like `acuterium-master-project-dashboard.vercel.app`) — you should see the password prompt. Enter the password → dashboard loads → but data will be empty until step 9.

## Step 9 — Seed the Google Sheet (5 min)

This is the one-time call that populates the sheet with 28 matrix rows, 52 tasks, 14 milestones, 20 KPIs.

Run from your terminal:

```bash
curl -X POST https://acuterium-master-project-dashboard.vercel.app/api/seed \
  -H "Authorization: Bearer YOUR_SEED_SECRET_FROM_STEP_7"
```

Replace `YOUR_SEED_SECRET_FROM_STEP_7` with the value you set as `SEED_SECRET`.

Expected response:
```json
{"ok":true,"counts":{"matrix":28,"tasks":52,"milestones":14,"kpis":20}}
```

Now refresh the dashboard URL — you should see all 4 tabs populated. Toggle a task. Check the Google Sheet directly — the `done` column should flip.

## Step 10 — Attach the custom domain (15 min)

1. Vercel: **Settings → Domains** → **Add**
2. Enter: `master-project.acuterium.ai` → Add.
3. Vercel shows you the DNS record to create. It will be a CNAME:
   ```
   master-project.acuterium.ai → cname.vercel-dns.com
   ```
4. Go to your DNS provider for `acuterium.ai` (Cloudflare, Namecheap, GoDaddy — wherever the domain is managed).
5. Create the CNAME record exactly as Vercel specifies. TTL: 300 seconds initially.
6. Wait 1-30 minutes for DNS propagation. You can check with:
   ```bash
   dig master-project.acuterium.ai
   ```
7. Back in Vercel, the domain status will flip to **Valid Configuration** and SSL provisions automatically (1-5 min).
8. Visit https://master-project.acuterium.ai — password prompt appears → enter password → dashboard loads.

## Step 11 — Enable Vercel Analytics (3 min)

1. Vercel project → **Analytics** tab → **Enable**.
2. Same for **Speed Insights** tab.

Analytics data starts collecting on the next page view. The `@vercel/analytics` and `@vercel/speed-insights` packages are already wired into `app/layout.tsx`.

## Step 12 — Final verification (15 min)

From a desktop browser:
- [ ] https://master-project.acuterium.ai loads
- [ ] Password prompt appears, entering the password loads the dashboard
- [ ] All 4 tabs render with full data
- [ ] Toggling a task persists across page reload
- [ ] Toggling a milestone persists across page reload
- [ ] Editing a KPI value persists across page reload
- [ ] The corresponding row in the Google Sheet updates
- [ ] The AuditLog sheet appends a row per action

From a mobile browser:
- [ ] Same URL loads with password
- [ ] Bottom tab bar appears
- [ ] Swiping left/right between tabs works
- [ ] Task toggles work on tap
- [ ] KPI inline edit works (numeric keyboard should appear for KPIs with numeric values)

In Sentry:
- [ ] Visit the project — there should be a few "session started" events
- [ ] Deliberately trigger an error (try editing a KPI with the network disabled) — Sentry should capture it

## Step 13 — Cleanup (2 min)

```bash
rm DEPLOYMENT-CREDENTIALS.md
```

Save the Vercel password and `SEED_SECRET` to your password manager.

---

## You're done.

The dashboard is now live at `master-project.acuterium.ai`, password-protected, syncing with the Google Sheet, error-tracked via Sentry, and analytics-tracked via Vercel. Cowork can also read/write the same sheet through its Google Drive connector, eliminating the need for separate sync logic.

## Troubleshooting

**Build fails on Vercel with "GOOGLE_PRIVATE_KEY parse error"**
Vercel sometimes mangles multi-line env vars. Edit the variable, ensure the entire PEM block including `\n` characters is intact. The `replace(/\\n/g, '\n')` in `lib/sheets.ts` handles either format.

**Dashboard loads but data is empty**
You skipped step 9. Run the seed curl call.

**Toggling a task does nothing**
Open browser devtools → Network tab → toggle a task → look for the POST to `/api/sheet`. If it returns 401/403, the service account doesn't have edit access to the sheet (redo step 3.10). If it returns 500, check the Vercel runtime logs.

**Mobile tabs not appearing**
The breakpoint is 768px. Try in a narrower window or actual mobile device.

**DNS not propagating**
Some DNS providers are slow. Wait 30 minutes. If still failing, check the record exists with `dig master-project.acuterium.ai CNAME` and that it matches Vercel's expected value.

---

Acuterium Technologies Inc. · ACUTERIUM-INTERNAL // SOVEREIGN
