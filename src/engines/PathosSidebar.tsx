/**
 * PathosSidebar · floating right-edge 5-axis visualisation.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2535-2556 (verbatim port).
 *
 * Collapsed by default at 54px wide (just the colored dots). Hover expands
 * to 188px showing axis labels, bar fills, and integer values. Hidden on
 * mobile (<680px) per the master-ops.css media query — TELOS handles
 * advisory output on small surfaces.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import type { PathosState } from './types';

export type PathosSidebarProps = {
  pathos: PathosState;
};

const AXES: Array<{ key: keyof PathosState; label: string; color: string }> = [
  { key: 'stress', label: 'Stress', color: '#FF6B35' },
  { key: 'focus', label: 'Focus', color: '#00E5D4' },
  { key: 'curiosity', label: 'Curiosity', color: '#7B68EE' },
  { key: 'fatigue', label: 'Fatigue', color: '#C9A84C' },
  { key: 'satisfaction', label: 'Satisfaction', color: '#30D158' },
];

export function PathosSidebar({ pathos }: PathosSidebarProps) {
  return (
    <div id="pathos-bar" title="PATHOS · 5-axis emotion state">
      <div className="pathos-header">PATHOS</div>
      {AXES.map((a) => (
        <div key={a.key} className="pathos-axis" style={{ color: a.color }}>
          <div className="pa-dot" />
          <div className="pa-lab">{a.label}</div>
          <div className="pa-bar">
            <div className="fill" style={{ width: `${pathos[a.key]}%` }} />
          </div>
          <div className="pa-val">{pathos[a.key]}</div>
        </div>
      ))}
    </div>
  );
}
