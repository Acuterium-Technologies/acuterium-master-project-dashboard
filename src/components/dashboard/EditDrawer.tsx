/**
 * Write-back drawer · Phase 3b.04.
 *
 * Slides in from the right · 420 px wide · backdrop click closes · Esc closes.
 * Renders a per-field input governed by `FieldSpec`. Before submit, runs the
 * client-side CWH evaluator preview (same path Phase 2 uses for parity);
 * Save is disabled when preview = deny. On submit, POSTs through the
 * Phase 3a `/api/sheets/update` with a ULID idempotencyKey.
 *
 * Server verdict is authoritative — a deny coming back from the server (rare
 * in normal operation due to parity guarantee) keeps the drawer open and
 * surfaces the deny reason instead of optimistically applying the edit.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ulid } from 'ulid';

import { evaluateCWH } from '../../lib/cwh/evaluate';
import type {
  EvaluatorResult,
  KairosModeApi,
  TransitionRequest,
} from '../../lib/cwh/types';
import type { PathosState as ApiPathos } from '../../engines/types';
import type { FieldSpec, UpdateTarget } from '../../lib/dashboard/edit-specs';

const KAIROS_TO_API: Record<string, KairosModeApi> = {
  aui: 'AUI',
  tuui: 'TUUI',
  hud: 'HUD',
  gui: 'GUI',
  dashboard: 'Dashboard',
  ambient: 'Ambient',
};

type RowValue = string | boolean | number | null | undefined;

export type EditDrawerProps = {
  open: boolean;
  target: UpdateTarget;
  targetId: string;
  row: Record<string, RowValue>;
  fieldSpec: readonly FieldSpec[];
  /** Operator context · used to build the CWH preview + the server payload. */
  actorSession: string;
  pathos: ApiPathos;
  kairosMode: string;
  doctrineScore: number;
  onClose: () => void;
  onSaved?: (updatedRow: Record<string, RowValue>) => void;
};

type ServerResponse = {
  verdict?: 'allow' | 'deny';
  reason?: string;
  ruleId?: string;
  auditId?: string;
  error?: string;
};

function asString(v: RowValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

export function EditDrawer({
  open,
  target,
  targetId,
  row,
  fieldSpec,
  actorSession,
  pathos,
  kairosMode,
  doctrineScore,
  onClose,
  onSaved,
}: EditDrawerProps) {
  const [editedRow, setEditedRow] = useState<Record<string, RowValue>>(row);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setEditedRow(row);
    setServerError(null);
  }, [row, targetId, target]);

  // Esc closes the drawer · attached to window when open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // First changed field drives the preview
  const changedField = useMemo(
    () => fieldSpec.find((fs) => !fs.readOnly && editedRow[fs.name] !== row[fs.name]),
    [fieldSpec, editedRow, row],
  );

  const cwhPreview: EvaluatorResult | null = useMemo(() => {
    if (!changedField) return null;
    const baseTarget = target.replace('-update', '') as TransitionRequest['target'];
    const previewInput: TransitionRequest = {
      target: target,
      targetId,
      fromState: '(read)',
      toState: asString(editedRow[changedField.name]),
      actor: { session: actorSession, pathos },
      context: {
        kairosMode: KAIROS_TO_API[kairosMode] ?? 'AUI',
        doctrineScore,
      },
    };
    // The evaluator handles both base and *-update target enum values.
    // We pass *-update so the audit trail matches; rule firing logic treats
    // them the same (Phase 2 evaluator defaults to CWH-R-12 for unmapped
    // targets when the welfare guards don't trip).
    void baseTarget;
    return evaluateCWH(previewInput);
  }, [changedField, editedRow, target, targetId, actorSession, pathos, kairosMode, doctrineScore]);

  const canSave = Boolean(changedField) && cwhPreview?.verdict === 'allow' && !submitting;

  const handleSave = useCallback(async () => {
    if (!changedField || !canSave) return;
    setSubmitting(true);
    setServerError(null);

    const idempotencyKey = ulid();
    const payload = {
      target,
      targetId,
      field: changedField.name,
      newValue: asString(editedRow[changedField.name]),
      actor: { session: actorSession, pathos },
      context: {
        kairosMode: KAIROS_TO_API[kairosMode] ?? 'AUI',
        doctrineScore,
      },
      idempotencyKey,
    };

    try {
      const res = await fetch('/api/sheets/update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ServerResponse;
      if (!res.ok) {
        setServerError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.verdict === 'deny') {
        setServerError(`Server denied · ${json.ruleId ?? ''} ${json.reason ?? ''}`.trim());
        return;
      }
      onSaved?.(editedRow);
      window.setTimeout(() => closeRef.current(), 800);
    } catch (err) {
      setServerError(String(err));
    } finally {
      setSubmitting(false);
    }
  }, [
    canSave,
    changedField,
    editedRow,
    target,
    targetId,
    actorSession,
    pathos,
    kairosMode,
    doctrineScore,
    onSaved,
  ]);

  if (!open) return null;

  return (
    <div
      className="acu-edit-drawer__backdrop"
      data-qa="edit-drawer-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="acu-edit-drawer"
        data-qa="edit-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acu-edit-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="acu-edit-drawer__header">
          <h2 id="acu-edit-drawer-title">
            Edit · {target.replace('-update', '')} · {targetId}
          </h2>
          <button
            type="button"
            className="acu-edit-drawer__close"
            onClick={onClose}
            aria-label="Close edit drawer"
          >
            ✕
          </button>
        </header>

        <div className="acu-edit-drawer__cwh-status">
          {cwhPreview ? (
            cwhPreview.verdict === 'allow' ? (
              <span className="is-green">
                CWH preview · allow · {cwhPreview.ruleId} (Δ {cwhPreview.doctrineDelta})
              </span>
            ) : (
              <span className="is-red">
                CWH preview · deny · {cwhPreview.ruleId} · {cwhPreview.reason ?? ''}
              </span>
            )
          ) : (
            <span className="is-neutral">No changes yet · pick a field to edit</span>
          )}
          <span className="acu-edit-drawer__pathos-strip">
            S {Math.round(pathos.stress)} · F {Math.round(pathos.focus)} · C{' '}
            {Math.round(pathos.curiosity)} · Fa {Math.round(pathos.fatigue)} · Sa{' '}
            {Math.round(pathos.satisfaction)}
          </span>
        </div>

        <form
          className="acu-edit-drawer__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {fieldSpec.map((fs) => (
            <FieldInput
              key={fs.name}
              spec={fs}
              value={editedRow[fs.name]}
              onChange={(v) => setEditedRow((prev) => ({ ...prev, [fs.name]: v }))}
            />
          ))}
        </form>

        <footer className="acu-edit-drawer__footer">
          {serverError && (
            <div className="acu-edit-drawer__error" role="alert">
              {serverError}
            </div>
          )}
          <button type="button" className="acu-edit-drawer__btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="acu-edit-drawer__btn-save"
            onClick={handleSave}
            disabled={!canSave}
          >
            {submitting ? 'Saving…' : 'Save edit'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function FieldInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: RowValue;
  onChange: (v: RowValue) => void;
}) {
  if (spec.readOnly) {
    return (
      <label className="acu-edit-drawer__field is-readonly">
        <span>{spec.label}</span>
        <input value={asString(value)} readOnly />
      </label>
    );
  }
  if (spec.type === 'boolean') {
    return (
      <label className="acu-edit-drawer__field is-boolean">
        <span>{spec.label}</span>
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  }
  if (spec.type === 'enum') {
    return (
      <label className="acu-edit-drawer__field is-enum">
        <span>{spec.label}</span>
        <select value={asString(value)} onChange={(e) => onChange(e.target.value)}>
          {(spec.enumValues ?? []).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (spec.type === 'date') {
    return (
      <label className="acu-edit-drawer__field is-date">
        <span>{spec.label}</span>
        <input
          type="date"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }
  return (
    <label className="acu-edit-drawer__field is-text">
      <span>{spec.label}</span>
      <input
        type="text"
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
