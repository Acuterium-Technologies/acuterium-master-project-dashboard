/**
 * TelosPanel · floating right-bottom intent-oracle card.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2715-2741 (verbatim port).
 *
 * Hides itself when there are no predictions (TELOS returns an empty array).
 * Collapsible by clicking the header — collapsed state slides the panel
 * mostly off-screen leaving only the header strip visible.
 *
 * Each prediction is click-actionable. The parent App() routes `action`:
 *   – '_mode:<m>' → KAIROS mode switch
 *   – everything else → setSection(action)
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useState } from 'react';
import type { TelosPrediction } from './types';

export type TelosPanelProps = {
  predictions: TelosPrediction[];
  onAction: (action: string) => void;
};

export function TelosPanel({ predictions, onAction }: TelosPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  if (!predictions.length) return null;
  return (
    <div id="telos-panel" className={collapsed ? 'collapsed' : ''}>
      <div className="telos-head" onClick={() => setCollapsed((c) => !c)}>
        <span className="telos-title">TELOS · INTENT ORACLE</span>
        <span className="mono xs muted">
          {predictions.length} · {collapsed ? '▴' : '▾'}
        </span>
      </div>
      {!collapsed && (
        <div className="telos-pred">
          {predictions.map((p) => (
            <div key={p.id} style={{ cursor: 'pointer' }} onClick={() => onAction(p.action)}>
              <div className="row1">
                <span className="pred-id">
                  {p.id} · {p.source}
                </span>
                <span className="pred-conf">{p.conf}%</span>
              </div>
              <div className="pred-title">{p.title}</div>
              <div className="pred-meter">
                <div className="fill" style={{ width: p.conf + '%' }} />
              </div>
              <div className="muted xs mono" style={{ marginTop: 2 }}>
                {p.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
