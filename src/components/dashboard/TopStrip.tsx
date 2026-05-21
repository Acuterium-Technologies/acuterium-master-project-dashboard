/**
 * Dashboard-mode top strip · Phase 3b.01.
 *
 * 60 px tall. Logo + brand text + section pills + compact ACAI gauge +
 * status chips. The section pills route to the same `section` state
 * that the main page.tsx nav uses.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { AcuteriumLogo } from '../brand/AcuteriumLogo';
import { ChronosLabel } from './ChronosLabel';
import { ConformanceGauge } from './ConformanceGauge';

const SECTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'campaign', label: 'CAMPAIGN' },
  { id: 'build', label: 'BUILD' },
  { id: 'portfolio', label: 'PORTFOLIO' },
  { id: 'channels', label: 'CHANNELS' },
  { id: 'decisions', label: 'DECISIONS' },
  { id: 'migration', label: 'MIGRATION' },
  { id: 'doctrine', label: 'DOCTRINE' },
];

export type TopStripProps = {
  currentSection?: string;
  onSectionChange?: (section: string) => void;
};

export function TopStrip({ currentSection, onSectionChange }: TopStripProps) {
  return (
    <header className="acu-bi-grid__top-strip" data-qa="top-strip">
      <div className="acu-top-strip__brand">
        <AcuteriumLogo size={32} />
        <span className="acu-top-strip__brand-text">ACUTERIUM · MASTER OPS</span>
      </div>

      <nav className="acu-top-strip__sections" data-qa="top-strip-sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`acu-top-strip__pill ${currentSection === s.id ? 'is-active' : ''}`}
            onClick={() => onSectionChange?.(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="acu-top-strip__metrics">
        <ChronosLabel variant="compact" />
        <ConformanceGauge variant="compact" target={72} />
      </div>
    </header>
  );
}
