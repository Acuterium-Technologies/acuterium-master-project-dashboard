/**
 * Heatmap · 2-D matrix density visualisation.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1278-1301.
 */

export type HeatmapProps = {
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  size?: number;
};

export function Heatmap({ data, xLabels, yLabels, size = 28 }: HeatmapProps) {
  const max = Math.max(...data.flat()) || 1;
  const padL = 60;
  const padT = 22;
  const w = padL + xLabels.length * size + 8;
  const h = padT + yLabels.length * size + 8;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="chart-svg"
      style={{ maxWidth: w, height: 'auto' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {xLabels.map((l, i) => (
        <text
          key={`x${i}`}
          x={padL + i * size + size / 2}
          y={14}
          textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: 'rgba(180,215,245,.78)' }}
        >
          {l}
        </text>
      ))}
      {yLabels.map((l, i) => (
        <text
          key={`y${i}`}
          x={padL - 6}
          y={padT + i * size + size / 2 + 3}
          textAnchor="end"
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            fill: 'rgba(180,215,245,.85)',
            letterSpacing: '.08em',
          }}
        >
          {l}
        </text>
      ))}
      {data.map((row, y) =>
        row.map((n, x) => {
          const o = n === 0 ? 0.04 : 0.15 + (n / max) * 0.85;
          return (
            <g key={`${x}-${y}`}>
              <rect
                x={padL + x * size + 1}
                y={padT + y * size + 1}
                width={size - 2}
                height={size - 2}
                fill="#00E5D4"
                opacity={o}
                rx={3}
              >
                <title>{`${yLabels[y]} × ${xLabels[x]} = ${n}`}</title>
              </rect>
              {n > 0 ? (
                <text
                  x={padL + x * size + size / 2}
                  y={padT + y * size + size / 2 + 3}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 9,
                    fill: n >= 2 ? '#020412' : 'rgba(230,245,255,.85)',
                    fontWeight: 600,
                    pointerEvents: 'none',
                  }}
                >
                  {n}
                </text>
              ) : null}
            </g>
          );
        }),
      )}
    </svg>
  );
}
