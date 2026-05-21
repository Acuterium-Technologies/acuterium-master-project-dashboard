/**
 * Dashboard-mode left rail · Phase 3b.01.
 *
 * 240 px wide. Shows PATHOS 5-axis (canon order), KAIROS mode pills,
 * and a session counter pulled from MNEMOS.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { KAIROS_MODES, MODE_LABELS } from '../../engines/types';
import type { KairosMode, PathosState } from '../../engines/types';

export type LeftRailProps = {
  pathos: PathosState;
  mode: string;
  onModeChange: (mode: string) => void;
  sessionCount: number;
};

const AXES: ReadonlyArray<{ key: keyof PathosState; label: string; color: string }> = [
  { key: 'stress', label: 'Stress', color: '#FF6B35' },
  { key: 'focus', label: 'Focus', color: '#00E5D4' },
  { key: 'curiosity', label: 'Curiosity', color: '#7B68EE' },
  { key: 'fatigue', label: 'Fatigue', color: '#C9A84C' },
  { key: 'satisfaction', label: 'Satisfaction', color: '#30D158' },
];

export function LeftRail({ pathos, mode, onModeChange, sessionCount }: LeftRailProps) {
  return (
    <aside className="acu-bi-grid__left-rail" data-qa="left-rail">
      <section className="acu-pathos-sidebar" data-qa="pathos-sidebar">
        <h3 className="acu-rail-heading">PATHOS</h3>
        {AXES.map((a) => (
          <div key={a.key} className="acu-pathos-axis" style={{ color: a.color }}>
            <span className="acu-pathos-axis__label">{a.label}</span>
            <div className="acu-pathos-axis__bar">
              <div
                className="acu-pathos-axis__fill"
                style={{ width: `${pathos[a.key]}%`, background: a.color }}
              />
            </div>
            <span className="acu-pathos-axis__value">{pathos[a.key]}</span>
          </div>
        ))}
      </section>

      <section className="acu-kairos-mini" data-qa="kairos-mini">
        <h3 className="acu-rail-heading">KAIROS</h3>
        <div className="acu-kairos-mini__pills">
          {KAIROS_MODES.map((m: KairosMode) => (
            <button
              key={m}
              type="button"
              className={`acu-kairos-mini__pill ${mode === m ? 'is-active' : ''}`}
              onClick={() => onModeChange(m)}
              data-qa={`mode-pill-${m}`}
              title={MODE_LABELS[m]}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="acu-session-counter" data-qa="session-counter">
        <span className="acu-session-counter__label">SESSION</span>
        <span className="acu-session-counter__value">#{sessionCount}</span>
      </section>
    </aside>
  );
}
