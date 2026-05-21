/**
 * ACAI V2 conformance gauge · Phase 3b.03.
 *
 * Composite score = 0.7 × structural + 0.3 × operational (LOCKED in spec).
 *
 * - variant="compact" lives in the TopStrip and shows `ACAI 72/85`.
 * - variant="full" lives in Overview and shows the full 22-row breakdown.
 *
 * Article 22 boundary: gauge DISPLAYS · NEVER auto-acts. The operator
 * interprets the score; the surface only surfaces measurements.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useState } from 'react';

import {
  computeStructuralConformance,
  type StructuralConformance,
} from '../../lib/conformance/matrix';

type OperationalMetrics = {
  denyRate24h: number;
  p95LatencyMs: number;
  rateLimitHits24h: number;
  sampleSize: number;
  operationalScore: number;
  source: 'postgres' | 'unavailable';
};

export type ConformanceGaugeProps = {
  variant?: 'compact' | 'full';
  /** Target threshold (defaults to 85). Phase 3b intermediate target: 72. */
  target?: number;
};

const REFRESH_MS = 30_000;

export function ConformanceGauge({ variant = 'full', target = 85 }: ConformanceGaugeProps) {
  const [structural, setStructural] = useState<StructuralConformance | null>(null);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);

  useEffect(() => {
    setStructural(computeStructuralConformance());

    let cancelled = false;
    async function fetchOps() {
      try {
        const res = await fetch('/api/dashboard/conformance', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as OperationalMetrics;
        if (!cancelled) setOperational(json);
      } catch {
        // Silent · gauge falls back to structural-only.
      }
    }
    fetchOps();
    const interval = window.setInterval(fetchOps, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!structural) return null;

  const composite = operational
    ? Math.round(0.7 * structural.score + 0.3 * operational.operationalScore)
    : Math.round(structural.score);

  const healthy = composite >= target;

  if (variant === 'compact') {
    return (
      <div
        className={`acu-conformance-gauge acu-conformance-gauge--compact ${healthy ? 'is-healthy' : 'is-below-target'}`}
        data-qa="conformance-gauge-compact"
        title={`ACAI conformance: ${composite}% (target ${target}%) · structural ${Math.round(structural.score)}% · operational ${operational ? Math.round(operational.operationalScore) : '–'}%`}
      >
        <span className="acu-conformance-gauge__label">ACAI</span>
        <span className="acu-conformance-gauge__score">{composite}</span>
        <span className="acu-conformance-gauge__sep">/</span>
        <span className="acu-conformance-gauge__target">{target}</span>
      </div>
    );
  }

  return (
    <section className="acu-conformance-gauge acu-conformance-gauge--full" data-qa="conformance-gauge">
      <header className="acu-conformance-gauge__header">
        <h3>ACAI V2 Conformance</h3>
        <div className={`acu-conformance-gauge__score-large ${healthy ? 'is-healthy' : 'is-below-target'}`}>
          {composite}%
        </div>
      </header>

      <div className="acu-conformance-gauge__bar">
        <div className="acu-conformance-gauge__fill" style={{ width: `${composite}%` }} />
        <div className="acu-conformance-gauge__target-line" style={{ left: `${target}%` }} />
      </div>

      <details className="acu-conformance-gauge__breakdown">
        <summary>
          Structural · {structural.rows.filter((r) => r.present).length} / {structural.rows.length} ·{' '}
          {Math.round(structural.score)}%
        </summary>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Expected</th>
              <th>Status</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {structural.rows.map((r, i) => (
              <tr key={i} className={r.present ? 'is-present' : 'is-missing'}>
                <td>{r.category}</td>
                <td>{r.expected}</td>
                <td>{r.present ? '✓' : '·'}</td>
                <td>{r.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {operational && (
        <footer className="acu-conformance-gauge__ops">
          <span>24h deny rate: {(operational.denyRate24h * 100).toFixed(1)}%</span>
          <span>P-95 latency: {operational.p95LatencyMs} ms</span>
          <span>Sample: {operational.sampleSize}</span>
          <span>Source: {operational.source}</span>
        </footer>
      )}
    </section>
  );
}
