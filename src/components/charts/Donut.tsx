/**
 * Donut · doctrine compliance arc.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1046-1059.
 *
 * Pure SVG · no chart library. Animates strokeDashoffset over 0.8s with
 * a cubic-bezier ease so the gauge feels alive when scores recompute.
 */

export type DonutProps = {
  pct: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  sub?: string;
};

export function Donut({
  pct,
  size = 160,
  thickness = 14,
  color = '#00E5D4',
  label,
  sub,
}: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, pct));
  const off = c * (1 - safe / 100);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg" style={{ maxWidth: size }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,229,212,.08)" strokeWidth={thickness} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" className="donut-center">
        {safe}%
      </text>
      {label ? (
        <text x={size / 2} y={size / 2 + 22} textAnchor="middle" className="donut-sub">
          {label}
        </text>
      ) : null}
      {sub ? (
        <text
          x={size / 2}
          y={size / 2 + 34}
          textAnchor="middle"
          className="donut-sub"
          style={{ opacity: 0.7 }}
        >
          {sub}
        </text>
      ) : null}
    </svg>
  );
}
