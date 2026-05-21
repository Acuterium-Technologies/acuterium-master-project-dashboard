/**
 * Deterministic 14-point pseudo-random trend generator.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 642-651.
 *
 * Given a stable KPI id, returns a 14-day trend series clamped to 0..100.
 * The hash → sine/cosine cascade produces trends that vary across KPIs
 * but remain identical across reloads, so sparkline shapes don't jitter.
 *
 * Pure function · no DOM · no side effects. Same shape as the original
 * v1.3 helper so behaviour is bit-for-bit identical.
 */
export function seedTrend(kpiId: string, _target?: string): number[] {
  let h = 0;
  for (let i = 0; i < kpiId.length; i++) {
    h = (h * 31 + kpiId.charCodeAt(i)) | 0;
  }
  const series: number[] = [];
  let v = 5 + Math.abs(h % 30);
  for (let i = 0; i < 14; i++) {
    const drift = (Math.sin(i * 0.7 + (h % 7)) + Math.cos(i * 0.4 + (h % 5))) * 8;
    v = Math.max(0, Math.min(100, v + drift + (i > 9 ? 2 : 0)));
    series.push(Math.round(v));
  }
  return series;
}
