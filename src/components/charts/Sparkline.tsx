/**
 * Sparkline · 14-point KPI trend.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1088-1098.
 */

export type SparklineProps = {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
};

export function Sparkline({ data, w = 120, h = 32, color = '#00E5D4' }: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const r = max - min || 1;
  const pts = data
    .map((d, i) => [i * (w / (data.length - 1)), h - ((d - min) / r) * (h - 4) - 2].join(','))
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: w }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <polyline points={`${pts} ${w},${h} 0,${h}`} fill={color} opacity={0.1} />
    </svg>
  );
}
