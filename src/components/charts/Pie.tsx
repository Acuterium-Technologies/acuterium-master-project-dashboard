/**
 * Pie · true wedges with optional donut hole.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1146-1184.
 */

export type PieSlice = { n: number; color: string; label: string };

export type PieProps = {
  slices: PieSlice[];
  size?: number;
  inner?: number;
  gap?: number;
  labels?: boolean;
};

export function Pie({ slices, size = 180, inner = 0, gap = 2, labels = true }: PieProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const total = slices.reduce((s, x) => s + x.n, 0) || 1;
  let acc = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const frac = s.n / total;
    const a0 = acc;
    const a1 = acc + frac * Math.PI * 2;
    acc = a1;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    let d: string;
    if (inner > 0) {
      const ri = r * inner;
      const xi0 = cx + ri * Math.cos(a0);
      const yi0 = cy + ri * Math.sin(a0);
      const xi1 = cx + ri * Math.cos(a1);
      const yi1 = cy + ri * Math.sin(a1);
      d = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ri},${ri} 0 ${large} 0 ${xi0},${yi0} Z`;
    } else {
      d = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
    }
    const mid = (a0 + a1) / 2;
    const lr = inner > 0 ? r * (0.55 + inner / 2) : r * 0.66;
    const lx = cx + lr * Math.cos(mid);
    const ly = cy + lr * Math.sin(mid);
    return { d, color: s.color, label: s.label, n: s.n, pct: Math.round(frac * 100), lx, ly, frac };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg" style={{ maxWidth: size }}>
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} stroke="#020412" strokeWidth={gap} opacity={0.92}>
          <title>{`${a.label}: ${a.n} (${a.pct}%)`}</title>
        </path>
      ))}
      {labels &&
        arcs
          .filter((a) => a.frac > 0.06)
          .map((a, i) => (
            <text
              key={`pl${i}`}
              x={a.lx}
              y={a.ly + 3}
              textAnchor="middle"
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                fill: '#020412',
                fontWeight: 700,
                pointerEvents: 'none',
              }}
            >
              {a.pct}%
            </text>
          ))}
    </svg>
  );
}

export type PieLegendProps = {
  slices: PieSlice[];
};

export function PieLegend({ slices }: PieLegendProps) {
  const total = slices.reduce((s, x) => s + x.n, 0) || 1;
  return (
    <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      {slices.map((s, i) => (
        <div key={i} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
          <span className="row" style={{ gap: 6 }}>
            <span
              style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }}
            />
            <span className="sm">{s.label}</span>
          </span>
          <span className="mono xs muted">
            {s.n} · {Math.round((s.n / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
