/**
 * Shared UI primitives · Panel, Metric, ChipRow, Pill.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1307-1332.
 *
 * Class names track the ACAI V2 stylesheet tokens already on the page
 * (panel, panel-title, metric, kicker, chip, pill, row, sm, mono, xs,
 * muted, dot). Modes consume these primitives only; do not inline
 * .panel / .metric styling at mode level.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import type { ReactNode } from 'react';

export type PanelProps = {
  title?: ReactNode;
  kicker?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, kicker, children, className = '' }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      {(title || kicker) && (
        <div className="panel-title">
          {title}
          {kicker ? <span className="kicker">{kicker}</span> : null}
        </div>
      )}
      {children}
    </div>
  );
}

export type MetricVariant = '' | 'gold' | 'red' | 'green' | 'violet';

export type MetricProps = {
  val: ReactNode;
  lab: ReactNode;
  sub?: ReactNode;
  variant?: MetricVariant;
};

export function Metric({ val, lab, sub, variant = '' }: MetricProps) {
  return (
    <div className={`metric ${variant}`}>
      <div className="val">{val}</div>
      <div className="lab">{lab}</div>
      {sub ? <div className="sub muted">{sub}</div> : null}
    </div>
  );
}

export type ChipVariant = '' | 'gold' | 'red' | 'green';

export type Chip = { label: ReactNode; variant?: ChipVariant };

export type ChipRowProps = { chips: Chip[] };

export function ChipRow({ chips }: ChipRowProps) {
  return (
    <div className="row">
      {chips.map((c, i) => (
        <span key={i} className={`chip ${c.variant || ''}`}>
          <span className="dot" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export type PillProps = {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  extra?: string;
};

export function Pill({ active = false, children, onClick, extra = '' }: PillProps) {
  return (
    <button className={`pill ${active ? 'active' : ''} ${extra}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}
