/**
 * StackedBar · normalised horizontal stack per row.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1061-1086.
 */

export type StackValue = { n: number; color: string; label?: string };
export type StackRow = { label: string; values: StackValue[] };

export type StackedBarProps = {
  data: StackRow[];
  maxLabel?: string;
  height?: number;
};

export function StackedBar({ data, height = 180 }: StackedBarProps) {
  const w = 520;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="chart-svg">
      {data.map((d, i) => {
        const total = d.values.reduce((s, v) => s + v.n, 0) || 1;
        const y = 10 + (i * (height - 30)) / data.length;
        let x = 130;
        return (
          <g key={i}>
            <text
              x={120}
              y={y + 12}
              textAnchor="end"
              style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'rgba(180,215,245,.78)' }}
            >
              {d.label}
            </text>
            {d.values.map((v, j) => {
              const ww = (v.n / total) * (w - 150);
              const seg = (
                <rect key={j} x={x} y={y} width={ww} height={16} fill={v.color} opacity={0.85} rx={3}>
                  <title>{`${v.label || ''}: ${v.n}`}</title>
                </rect>
              );
              x += ww + 1;
              return seg;
            })}
            <text
              x={w - 10}
              y={y + 12}
              textAnchor="end"
              style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'rgba(0,229,212,.85)' }}
            >
              {d.values.reduce((s, v) => s + v.n, 0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
