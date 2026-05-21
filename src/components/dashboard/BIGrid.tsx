/**
 * Dashboard-mode BI grid orchestrator · Phase 3b.01.
 *
 * When `mode === 'dashboard'`, wraps the page in a 3-rail layout:
 *   TopStrip (60px)
 *   LeftRail (240px) · CenterCanvas (flex) · RightRail (300px)
 *
 * For any other KAIROS mode (aui/hud/tuui/gui/ambient), this is a
 * transparent pass-through — children render directly.
 *
 * The breakpoint rules live in src/styles/bi-grid.css:
 *   ≥1280 px  → 3-rail
 *   768-1279  → rails collapse to drawers (toggleable)
 *   <768 px   → single column, rails hidden
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import type { ReactNode } from 'react';

import type { MnemosProfile, NexusSignals, PathosState, TelosPrediction } from '../../engines/types';
import { AuditLogTail } from './AuditLogTail';
import { ConformanceGauge } from './ConformanceGauge';
import { LeftRail } from './LeftRail';
import { MOEMatrixMini } from './MOEMatrixMini';
import { RightRail } from './RightRail';
import { TopStrip } from './TopStrip';

export type BIGridProps = {
  mode: string;
  pathos: PathosState;
  kairosLabel: string;
  profile: MnemosProfile;
  nexus: NexusSignals;
  predictions: TelosPrediction[];
  onTelosAction: (action: string) => void;
  onModeChange: (mode: string) => void;
  onSectionChange?: (section: string) => void;
  currentSection?: string;
  children: ReactNode;
};

export function BIGrid(props: BIGridProps) {
  const { mode, children } = props;
  if (mode !== 'dashboard') {
    return <>{children}</>;
  }

  return (
    <div className="acu-bi-grid" data-qa="bi-grid">
      <TopStrip
        currentSection={props.currentSection}
        onSectionChange={props.onSectionChange}
      />
      <div className="acu-bi-grid__body">
        <LeftRail
          pathos={props.pathos}
          mode={mode}
          onModeChange={props.onModeChange}
          sessionCount={props.profile.sessions || 1}
        />
        <main className="acu-bi-grid__center" data-qa="bi-grid-center">
          {children}
        </main>
        <RightRail
          predictions={props.predictions}
          onTelosAction={props.onTelosAction}
        />
      </div>
    </div>
  );
}

// Re-export the leaf pieces so page.tsx can import them as a single barrel.
export { AuditLogTail, ConformanceGauge, LeftRail, MOEMatrixMini, RightRail, TopStrip };
