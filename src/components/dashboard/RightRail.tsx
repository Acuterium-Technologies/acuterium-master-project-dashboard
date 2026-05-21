/**
 * Dashboard-mode right rail · Phase 3b.01.
 *
 * 300 px wide. Three stacked sections:
 *   1. TELOS · Intent Oracle (reuses Phase 1D TelosPanel)
 *   2. MOE · Expert Matrix mini (3b.02)
 *   3. Audit Log · live tail (Postgres-preferred, JSONL fallback)
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { TelosPanel } from '../../engines/TelosPanel';
import type { TelosPrediction } from '../../engines/types';
import { AuditLogTail } from './AuditLogTail';
import { MOEMatrixMini } from './MOEMatrixMini';

export type RightRailProps = {
  predictions: TelosPrediction[];
  onTelosAction: (action: string) => void;
};

export function RightRail({ predictions, onTelosAction }: RightRailProps) {
  return (
    <aside className="acu-bi-grid__right-rail" data-qa="right-rail">
      <section className="acu-telos-oracle-panel" data-qa="telos-oracle">
        <h3 className="acu-rail-heading">TELOS · INTENT ORACLE</h3>
        <div className="acu-telos-oracle-panel__body">
          <TelosPanel predictions={predictions} onAction={onTelosAction} />
        </div>
      </section>

      <section className="acu-moe-mini" data-qa="moe-mini">
        <h3 className="acu-rail-heading">MOE · EXPERT MATRIX</h3>
        <MOEMatrixMini />
      </section>

      <section className="acu-auditlog-tail" data-qa="auditlog-tail">
        <h3 className="acu-rail-heading">AUDIT LOG · LIVE TAIL</h3>
        <AuditLogTail />
      </section>
    </aside>
  );
}
