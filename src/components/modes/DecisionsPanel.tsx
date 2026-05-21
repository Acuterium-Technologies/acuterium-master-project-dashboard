/**
 * DecisionsPanel · 13 owner decisions · Dr. Jay arbitration queue.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2072-2095.
 *
 * Each toggle passes through the CWH gate so OD-04 closures are blocked
 * when the residue verdict is BLOCKED (D-05 Rule 2 enforcement).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { Panel } from '../ui/primitives';
import { cwhGate } from '../../lib/cwh-gate';
import { DECISIONS } from '../../data';
import type { PersistedState } from '../../data/types';

export type DecisionsPanelProps = {
  state: PersistedState;
  toggleOD: (id: string) => void;
};

export function DecisionsPanel({ state, toggleOD }: DecisionsPanelProps) {
  // Priority-1 surfaces first; preserves the v1.3 sort order.
  const sorted = [...DECISIONS].sort((a, b) =>
    a.priority === 'PRIO-1' ? -1 : b.priority === 'PRIO-1' ? 1 : 0,
  );

  const handleToggle = (id: string) => {
    const before = !!state.closedODs[id];
    const result = cwhGate({
      kind: 'OD',
      id,
      before,
      after: !before,
      persistedState: state,
    });
    if (result.allow) toggleOD(id);
  };

  return (
    <Panel title="Owner decisions" kicker="13 OD · Dr. Jay arbitration queue">
      <div className="grid g-2">
        {sorted.map((d) => (
          <div
            key={d.id}
            className={`card ${d.priority === 'PRIO-1' ? 'red' : state.closedODs[d.id] ? '' : 'gold'}`}
          >
            <div className="row">
              <span className="sub">{d.id}{d.priority ? ` · ${d.priority}` : ''}</span>
              <span className="right">
                <input
                  className="chk"
                  type="checkbox"
                  checked={!!state.closedODs[d.id]}
                  onChange={() => handleToggle(d.id)}
                  style={{ marginRight: 6 }}
                />
                <span
                  className="mono xs"
                  style={{ color: state.closedODs[d.id] ? 'var(--green-ok)' : 'var(--gold-prime)' }}
                >
                  {state.closedODs[d.id] ? 'CLOSED' : 'OPEN'}
                </span>
              </span>
            </div>
            <h5>{d.item}</h5>
            <p className="sm">{d.need}</p>
            <p className="xs muted"><strong>Blocking:</strong> {d.blocking}</p>
            <p className="xs" style={{ color: 'var(--cyan-prime)' }}>→ {d.rec}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
