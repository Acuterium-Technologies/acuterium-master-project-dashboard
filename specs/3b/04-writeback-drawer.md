# Spec 3b.04 · Write-back Drawer UI

**Sub-phase:** 3b
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 45 min
**Closes:** Operator's original request — "Add a write-back form UI to Phase 3 scope" (2026-05-21)

---

## Why

Phase 3a landed the `/api/sheets/update` write endpoint with full CWH gating, but there's no UI to invoke it. Operators currently have to edit the Sheet directly or POST via curl. This spec lands the right-side drawer that turns the dashboard into a true bidirectional surface.

## Out of scope

- Bulk edit (multi-row updates) · v1.6
- Inline-cell editing (click directly on a value to edit) · v1.6
- Undo/redo · v1.6 (the AuditLog from Phase 3a already captures every change · undo would be a UI sugar on top)

## UX contract

### Trigger

Every editable row in every section gets a small ✎ pencil button at the right edge. Clicking opens the drawer with the row's current values.

| Section | Editable target | Field-level lockdown |
|---|---|---|
| Tasks | All fields except `id`, `phase`, `day` (canonical from sheet) | `id`/`phase`/`day` shown read-only · others editable |
| Milestones | `title`, `criterion`, `status` | `id`, `phase`, `day` read-only |
| Decisions (OD) | `item`, `need`, `blocking`, `rec`, `status`, `priority` | `id` read-only |
| KPIs | `value`, `state` | `id`, `name`, `source`, `target` read-only |
| Surfaces | `announce`, `residue`, `action` | `name`, `url`, `host` read-only |
| Channels | `coverage`, `status`, `output`, `note`, `residueVerdict` | `id`, `name`, `surface`, `access` read-only |

Some fields will be enums (status, state) and render as dropdowns. Others are free-text.

### Drawer layout

Slides in from the right edge · 420 px wide · backdrop click closes · `Esc` key closes.

```
┌────────────────────────────────────────────────┐
│  Edit · Task T2-D5-01                  ✕      │
├────────────────────────────────────────────────┤
│  CWH STATUS: green · ready to write            │
│  Stress 40 / Focus 60 / Curiosity 50           │
│                                                │
│  ID            T2-D5-01           [read-only]  │
│  Phase         2                  [read-only]  │
│  Day           5                  [read-only]  │
│  Category      COWORK             ▼            │
│  Title         [Parse JSON evidence blocks…]   │
│  Done          ☐                                │
│  Completed at  [date picker]                    │
│  Blocked by    [text]                           │
│                                                │
│  [Cancel]                          [Save edit] │
├────────────────────────────────────────────────┤
│  Audit preview                                 │
│  This will write: { task-update, T2-D5-01,     │
│    field: "done", newValue: "true" }           │
│  Verdict will go through CWH-R-04 (task        │
│  legal transition) · expected: allow Δ +0.3    │
└────────────────────────────────────────────────┘
```

### CWH preview

Before submit, the drawer **previews** the CWH verdict by calling the existing evaluator client-side (same path Phase 2 used for client/server parity). If the preview shows `deny`, the Save button is disabled with the deny reason surfaced inline. Operator can:
- Adjust PATHOS sliders (only stress · others auto-update via NEXUS)
- Wait for state to settle
- Cancel

### Submit flow

```
1. Operator clicks Save
2. Generate ULID idempotencyKey
3. POST /api/sheets/update with target='task-update', targetId='T2-D5-01', field='done', newValue='true', idempotencyKey
4. Server: bearer-cookie auth + CWH evaluator + Sheets write + AuditLog append
5. Response: { verdict: 'allow', ruleId, auditId } OR { verdict: 'deny', reason, auditId } OR error
6. Drawer shows toast: "Saved · auditId=alog_..." or deny reason
7. On allow: drawer closes after 1s · table row refreshes via Sheets 30s poll OR optimistic update
8. On deny: drawer stays open · deny reason highlighted
9. On 401/429/502: error toast · operator can retry (idempotencyKey same → safe replay)
```

## Files to create

### `src/components/dashboard/EditDrawer.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ulid } from 'ulid';
import { evaluateCWH } from '@/src/lib/cwh/evaluate';
import { usePathos } from '@/src/engines/pathos';
import { useKairos } from '@/src/engines/kairos';
import { useMnemos } from '@/src/engines/mnemos';

export interface EditDrawerProps {
  target: 'task-update' | 'milestone-update' | 'od-update' | 'kpi-update' | 'surface-update';
  targetId: string;
  row: Record<string, string | boolean>;
  fieldSpec: FieldSpec[];          // which fields are editable, which are read-only, which are enums
  open: boolean;
  onClose(): void;
  onSaved(updatedRow: Record<string, string | boolean>): void;
}

export interface FieldSpec {
  name: string;
  label: string;
  type: 'text' | 'boolean' | 'date' | 'enum';
  enumValues?: string[];
  readOnly: boolean;
}

export function EditDrawer({ target, targetId, row, fieldSpec, open, onClose, onSaved }: EditDrawerProps) {
  const [editedRow, setEditedRow] = useState<Record<string, string | boolean>>(row);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pathos = usePathos();
  const { mode } = useKairos();
  const { sessionId } = useMnemos();

  useEffect(() => { setEditedRow(row); }, [row]);

  // Detect first changed field for the preview
  const changedField = fieldSpec.find(fs => !fs.readOnly && editedRow[fs.name] !== row[fs.name]);

  // CWH preview (client-side)
  const cwhPreview = changedField ? evaluateCWH({
    target: target.replace('-update', '') as 'task' | 'milestone' | 'od' | 'residue',
    targetId,
    fromState: '(read)',
    toState: String(editedRow[changedField.name]),
    actor: { session: sessionId, pathos },
    context: { kairosMode: mode, doctrineScore: 75 },  // doctrine score is currently passed through · server overrides anyway
  }) : null;

  const canSave = changedField && cwhPreview?.verdict === 'allow';

  async function handleSave() {
    if (!changedField || !canSave) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const idempotencyKey = ulid();
      const res = await fetch('/api/sheets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          target,
          targetId,
          field: changedField.name,
          newValue: String(editedRow[changedField.name]),
          actor: { session: sessionId, pathos },
          context: { kairosMode: mode, doctrineScore: 75 },
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? `HTTP ${res.status}`);
        return;
      }

      if (json.verdict === 'deny') {
        setServerError(`Denied · ${json.reason ?? json.ruleId}`);
        return;
      }

      onSaved(editedRow);
      setTimeout(onClose, 800);
    } catch (err) {
      setServerError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="acu-edit-drawer__backdrop" onClick={onClose} role="presentation">
      <aside
        className="acu-edit-drawer"
        data-qa="edit-drawer"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <header className="acu-edit-drawer__header">
          <h2>Edit · {target.replace('-update', '')} · {targetId}</h2>
          <button className="acu-edit-drawer__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="acu-edit-drawer__cwh-status">
          {cwhPreview ? (
            cwhPreview.verdict === 'allow'
              ? <span className="is-green">CWH preview: allow (Δ {cwhPreview.doctrineDelta})</span>
              : <span className="is-red">CWH preview: deny · {cwhPreview.reason}</span>
          ) : (
            <span className="is-neutral">No changes yet</span>
          )}
          <span className="acu-edit-drawer__pathos-strip">
            S {Math.round(pathos.stress)} · F {Math.round(pathos.focus)} · C {Math.round(pathos.curiosity)} · Fa {Math.round(pathos.fatigue)} · Sa {Math.round(pathos.satisfaction)}
          </span>
        </div>

        <form className="acu-edit-drawer__form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {fieldSpec.map(fs => (
            <FieldInput
              key={fs.name}
              spec={fs}
              value={editedRow[fs.name]}
              onChange={(v) => setEditedRow({ ...editedRow, [fs.name]: v })}
            />
          ))}
        </form>

        <footer className="acu-edit-drawer__footer">
          {serverError && <div className="acu-edit-drawer__error">{serverError}</div>}
          <button className="acu-edit-drawer__btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="acu-edit-drawer__btn-save"
            onClick={handleSave}
            disabled={!canSave || submitting}
          >
            {submitting ? 'Saving…' : 'Save edit'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function FieldInput({ spec, value, onChange }: { spec: FieldSpec; value: string | boolean; onChange(v: string | boolean): void }) {
  if (spec.readOnly) {
    return (
      <label className="acu-edit-drawer__field is-readonly">
        <span>{spec.label}</span>
        <input value={String(value ?? '')} readOnly />
      </label>
    );
  }

  if (spec.type === 'boolean') {
    return (
      <label className="acu-edit-drawer__field is-boolean">
        <span>{spec.label}</span>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      </label>
    );
  }

  if (spec.type === 'enum') {
    return (
      <label className="acu-edit-drawer__field is-enum">
        <span>{spec.label}</span>
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {(spec.enumValues ?? []).map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
    );
  }

  if (spec.type === 'date') {
    return (
      <label className="acu-edit-drawer__field is-date">
        <span>{spec.label}</span>
        <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  return (
    <label className="acu-edit-drawer__field is-text">
      <span>{spec.label}</span>
      <input type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
```

### `src/lib/dashboard/edit-specs.ts`

Defines the field spec for each editable target.

```typescript
import { FieldSpec } from '@/src/components/dashboard/EditDrawer';

export const TASK_SPEC: FieldSpec[] = [
  { name: 'id',           label: 'ID',            type: 'text',    readOnly: true },
  { name: 'phase',        label: 'Phase',         type: 'text',    readOnly: true },
  { name: 'day',          label: 'Day',           type: 'text',    readOnly: true },
  { name: 'cat',          label: 'Category',      type: 'enum',    enumValues: ['OPERATOR', 'COWORK', 'CLAUDE'], readOnly: false },
  { name: 'title',        label: 'Title',         type: 'text',    readOnly: false },
  { name: 'done',         label: 'Done',          type: 'boolean', readOnly: false },
  { name: 'completedAt',  label: 'Completed at',  type: 'date',    readOnly: false },
  { name: 'blockedBy',    label: 'Blocked by',    type: 'text',    readOnly: false },
];

export const MILESTONE_SPEC: FieldSpec[] = [
  { name: 'id',         label: 'ID',         type: 'text', readOnly: true },
  { name: 'phase',      label: 'Phase',      type: 'text', readOnly: true },
  { name: 'day',        label: 'Day',        type: 'text', readOnly: true },
  { name: 'title',      label: 'Title',      type: 'text', readOnly: false },
  { name: 'criterion',  label: 'Criterion',  type: 'text', readOnly: false },
  { name: 'status',     label: 'Status',     type: 'enum', enumValues: ['OPEN', 'IN-PROGRESS', 'CLOSED'], readOnly: false },
];

export const OD_SPEC: FieldSpec[] = [
  { name: 'id',         label: 'ID',         type: 'text', readOnly: true },
  { name: 'item',       label: 'Item',       type: 'text', readOnly: false },
  { name: 'need',       label: 'Need',       type: 'text', readOnly: false },
  { name: 'blocking',   label: 'Blocking',   type: 'text', readOnly: false },
  { name: 'rec',        label: 'Recommendation', type: 'text', readOnly: false },
  { name: 'status',     label: 'Status',     type: 'enum', enumValues: ['OPEN', 'DECIDED', 'DEFERRED'], readOnly: false },
  { name: 'priority',   label: 'Priority',   type: 'enum', enumValues: ['PRIO-1', 'PRIO-2', 'PRIO-3'], readOnly: false },
];

export const KPI_SPEC: FieldSpec[] = [
  { name: 'id',     label: 'ID',     type: 'text', readOnly: true },
  { name: 'name',   label: 'Name',   type: 'text', readOnly: true },
  { name: 'source', label: 'Source', type: 'text', readOnly: true },
  { name: 'target', label: 'Target', type: 'text', readOnly: true },
  { name: 'value',  label: 'Value',  type: 'text', readOnly: false },
  { name: 'state',  label: 'State',  type: 'enum', enumValues: ['achieved', 'on_track', 'at_risk', 'off_track'], readOnly: false },
];

export const SURFACE_SPEC: FieldSpec[] = [
  { name: 'name',     label: 'Name',     type: 'text', readOnly: true },
  { name: 'url',      label: 'URL',      type: 'text', readOnly: true },
  { name: 'host',     label: 'Host',     type: 'text', readOnly: true },
  { name: 'announce', label: 'Announce', type: 'text', readOnly: false },
  { name: 'residue',  label: 'Residue',  type: 'text', readOnly: false },
  { name: 'action',   label: 'Action',   type: 'text', readOnly: false },
];
```

### CSS · `src/styles/edit-drawer.css`

```css
.acu-edit-drawer__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.acu-edit-drawer {
  width: 420px;
  max-width: 100vw;
  height: 100vh;
  background: var(--bg-deep);
  border-left: 1px solid var(--border-cyan-bright);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  animation: drawerSlide 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes drawerSlide {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.acu-edit-drawer__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-cyan-mid);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.acu-edit-drawer__header h2 {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--cyan-prime);
  margin: 0;
}

.acu-edit-drawer__close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 20px;
}

.acu-edit-drawer__cwh-status {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-cyan-mid);
  font-family: var(--font-mono);
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.acu-edit-drawer__cwh-status .is-green { color: var(--green-ok); }
.acu-edit-drawer__cwh-status .is-red   { color: var(--red-alert); }
.acu-edit-drawer__cwh-status .is-neutral { color: var(--text-muted); }

.acu-edit-drawer__pathos-strip {
  color: var(--text-ghost);
  font-size: 10px;
}

.acu-edit-drawer__form {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.acu-edit-drawer__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.acu-edit-drawer__field > span {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.acu-edit-drawer__field input,
.acu-edit-drawer__field select {
  background: var(--glass-panel);
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: 13px;
}

.acu-edit-drawer__field input:focus,
.acu-edit-drawer__field select:focus {
  outline: none;
  border-color: var(--cyan-prime);
}

.acu-edit-drawer__field.is-readonly input {
  opacity: 0.55;
  cursor: not-allowed;
}

.acu-edit-drawer__field.is-boolean {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.acu-edit-drawer__footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-cyan-mid);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.acu-edit-drawer__error {
  flex: 1;
  color: var(--red-alert);
  font-family: var(--font-mono);
  font-size: 11px;
}

.acu-edit-drawer__btn-cancel,
.acu-edit-drawer__btn-save {
  background: var(--glass-panel);
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-pill);
  padding: 8px 18px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-primary);
  cursor: pointer;
}

.acu-edit-drawer__btn-save {
  background: rgba(0, 229, 212, 0.10);
  border-color: var(--border-cyan-bright);
  color: var(--cyan-prime);
}

.acu-edit-drawer__btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

## Files to modify

### Tables in `app/master-ops/page.tsx`

Add an ✎ pencil button at the right edge of each editable row. Wire its onClick to open `<EditDrawer>` with the row's data + the matching FieldSpec.

## Doctrinal red-lines

- Every write goes through `/api/sheets/update` (NO new write paths)
- Every write carries an `idempotencyKey` (Phase 3a · prevents double-writes)
- CWH preview MUST match server verdict in 100% of cases (client/server parity from Phase 2)
- Drawer cannot bypass deny (Save button disabled when preview = deny)
- Read-only fields enforced both in UI (input disabled) AND on server (Sheets adapter checks editable set)
- All edits logged to AuditLog via Phase 3a route
- Backdrop click + Esc both close the drawer (UX accessibility)
- Drawer respects `prefers-reduced-motion` (no slide animation if user has it set)

## Tests

`src/components/dashboard/EditDrawer.test.tsx`:

1. Drawer opens with `open={true}`, closes with `open={false}`
2. Read-only field renders as disabled input
3. Boolean field renders as checkbox
4. Enum field renders as select
5. Date field renders as date input
6. Changing a field updates `editedRow` state
7. CWH preview shows allow → Save enabled
8. CWH preview shows deny → Save disabled with reason
9. Click Save → POST to /api/sheets/update with idempotencyKey
10. Server returns 200 verdict=allow → onSaved called + drawer closes
11. Server returns 200 verdict=deny → error toast surfaces, drawer stays open
12. Backdrop click closes drawer
13. Esc key closes drawer

## Acceptance criteria

- [ ] Pencil button visible on every editable row (tasks/milestones/OD/KPI/surfaces)
- [ ] Clicking pencil opens drawer with row data
- [ ] Read-only fields are disabled inputs
- [ ] Editable fields render correctly per FieldSpec (text/boolean/enum/date)
- [ ] CWH preview updates as fields change
- [ ] Save button disabled when CWH preview is deny
- [ ] Successful save → drawer closes + row updates in dashboard
- [ ] Deny verdict → error toast + drawer stays open
- [ ] All 13 Vitest tests pass
- [ ] Bundle delta < +12 kB
- [ ] Accessibility: focus trap inside drawer · Esc closes · keyboard nav works
