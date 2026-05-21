/**
 * Sankey · multi-stage flow visualisation.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 1201-1276.
 *
 * stages: [[{id,label,color?}], [...], ...]
 * links:  [{from, to, value, color?}] referencing node ids across stages
 *
 * The renderer computes per-node value (max of in/out) for sizing, lays out
 * each stage vertically, and draws Bezier flow paths between source/target.
 * Stage labels at the bottom of the canvas follow the v1.3 default:
 * Channels → Normalised → Fusion → Matrix.
 */

export type SankeyNode = { id: string; label: string; color?: string };
export type SankeyLink = { from: string; to: string; value: number; color?: string };

export type SankeyProps = {
  stages: SankeyNode[][];
  links: SankeyLink[];
  width?: number;
  height?: number;
  nodePad?: number;
  nodeW?: number;
  stageLabels?: string[];
};

type IndexedNode = SankeyNode & {
  sx: number;
  ny: number;
  _in: number;
  _out: number;
  x: number;
  y: number;
  h: number;
};

const DEFAULT_LABELS = ['CHANNELS', 'NORMALISED', 'FUSION', 'MATRIX'];

export function Sankey({
  stages,
  links,
  width = 720,
  height = 300,
  nodePad = 12,
  nodeW = 14,
  stageLabels = DEFAULT_LABELS,
}: SankeyProps) {
  const stagesCount = stages.length;
  const padX = 48;
  const innerW = width - padX * 2;
  const colGap = (innerW - nodeW * stagesCount) / (stagesCount - 1 || 1);

  const nodeIndex: Record<string, IndexedNode> = {};
  stages.forEach((stage, sx) =>
    stage.forEach((n, ny) => {
      nodeIndex[n.id] = { ...n, sx, ny, _in: 0, _out: 0, x: 0, y: 0, h: 0 };
    }),
  );

  links.forEach((l) => {
    nodeIndex[l.from]._out += l.value;
    nodeIndex[l.to]._in += l.value;
  });

  const stageTotal = stages.map((stage) =>
    stage.reduce((s, n) => s + Math.max(nodeIndex[n.id]._in, nodeIndex[n.id]._out), 0),
  );

  const innerH = height - 20;
  stages.forEach((stage, sx) => {
    let y = 10;
    const total = stageTotal[sx] || 1;
    const padTotal = nodePad * (stage.length - 1);
    const usable = innerH - padTotal;
    stage.forEach((n) => {
      const v = Math.max(nodeIndex[n.id]._in, nodeIndex[n.id]._out);
      const h = Math.max((v / total) * usable, 14);
      nodeIndex[n.id].y = y;
      nodeIndex[n.id].h = h;
      y += h + nodePad;
    });
  });

  Object.values(nodeIndex).forEach((n) => {
    n.x = padX + n.sx * (nodeW + colGap);
  });

  const srcCursor: Record<string, number> = {};
  const tgtCursor: Record<string, number> = {};
  Object.keys(nodeIndex).forEach((k) => {
    srcCursor[k] = 0;
    tgtCursor[k] = 0;
  });

  const ratio = (sx: number): number =>
    (innerH - nodePad * (stages[sx].length - 1)) / (stageTotal[sx] || 1);

  const computedLinks = links.map((l) => {
    const s = nodeIndex[l.from];
    const t = nodeIndex[l.to];
    const sr = ratio(s.sx);
    const tr = ratio(t.sx);
    const sh = l.value * sr;
    const th = l.value * tr;
    const y1 = s.y + srcCursor[l.from];
    srcCursor[l.from] += sh;
    const y2 = t.y + tgtCursor[l.to];
    tgtCursor[l.to] += th;
    const x1 = s.x + nodeW;
    const x2 = t.x;
    const cx = (x1 + x2) / 2;
    const d = `M${x1},${y1 + sh / 2} C${cx},${y1 + sh / 2} ${cx},${y2 + th / 2} ${x2},${y2 + th / 2}`;
    const w = (sh + th) / 2;
    return { d, w, color: l.color || s.color || '#00E5D4', value: l.value, from: l.from, to: l.to };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="chart-svg">
      {computedLinks.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke={l.color} strokeWidth={Math.max(l.w, 2)} opacity={0.3}>
          <title>{`${l.from} → ${l.to}: ${l.value}`}</title>
        </path>
      ))}
      {Object.values(nodeIndex).map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y} width={nodeW} height={n.h} fill={n.color || '#00E5D4'} rx={2}>
            <title>{`${n.label} · in:${n._in} out:${n._out}`}</title>
          </rect>
          <text
            x={n.sx === 0 ? n.x - 6 : n.x + nodeW + 6}
            y={n.y + n.h / 2 + 3}
            textAnchor={n.sx === 0 ? 'end' : 'start'}
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              fill: 'rgba(230,245,255,.92)',
              letterSpacing: '.05em',
            }}
          >
            {n.label}
          </text>
        </g>
      ))}
      {stages.map((_, sx) => (
        <text
          key={`st${sx}`}
          x={padX + sx * (nodeW + colGap) + nodeW / 2}
          y={height + 16}
          textAnchor="middle"
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 9,
            letterSpacing: '.18em',
            fill: 'rgba(130,175,215,.62)',
            textTransform: 'uppercase',
          }}
        >
          {stageLabels[sx] || ''}
        </text>
      ))}
    </svg>
  );
}
