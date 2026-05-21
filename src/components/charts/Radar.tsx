/**
 * Radar · PATHOS 5-axis spider chart.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1101-1143.
 */

export type RadarAxis = { label: string; color?: string };

export type RadarProps = {
  axes: RadarAxis[];
  values: number[];
  size?: number;
  maxValue?: number;
  color?: string;
  fill?: string;
  bandColor?: string;
};

export function Radar({
  axes,
  values,
  size = 260,
  maxValue = 100,
  color = '#00E5D4',
  fill = 'rgba(0,229,212,.18)',
  bandColor = 'rgba(0,229,212,.10)',
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const n = axes.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const rr = (v / maxValue) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };

  const rings = [0.25, 0.5, 0.75, 1.0];
  const polyPath = values.map((v, i) => pt(i, v).join(',')).join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="chart-svg"
      style={{ maxWidth: size }}
      aria-label="PATHOS radar"
    >
      {rings.map((g, k) => {
        const pts = axes.map((_, i) => pt(i, maxValue * g).join(',')).join(' ');
        return (
          <polygon
            key={k}
            points={pts}
            fill="none"
            stroke={bandColor}
            strokeWidth={k === rings.length - 1 ? 1 : 0.6}
          />
        );
      })}
      {axes.map((_, i) => {
        const [x, y] = pt(i, maxValue);
        return (
          <line key={`sp${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={bandColor} strokeWidth={0.6} />
        );
      })}
      <polygon points={polyPath} fill={fill} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = pt(i, v);
        return (
          <circle key={`v${i}`} cx={x} cy={y} r={3.2} fill={color}>
            <title>{`${axes[i].label}: ${v}`}</title>
          </circle>
        );
      })}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, maxValue * 1.18);
        return (
          <text
            key={`l${i}`}
            x={lx}
            y={ly + 3}
            textAnchor="middle"
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 9,
              letterSpacing: '.10em',
              fill: a.color || 'rgba(180,215,245,.85)',
            }}
          >
            {a.label.toUpperCase()}
          </text>
        );
      })}
      {values.map((v, i) => {
        const [vx, vy] = pt(i, v);
        return (
          <text
            key={`vt${i}`}
            x={vx + 8}
            y={vy + 3}
            style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: color, fontWeight: 600 }}
          >
            {v}
          </text>
        );
      })}
    </svg>
  );
}
