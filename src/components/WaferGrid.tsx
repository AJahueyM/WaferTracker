import { useMemo } from 'react';
import type { Wafer, WaferNode } from '../types';
import { qualityColorMap, qualityLabelMap, qualityLevels } from '../utils/quality';
import './WaferGrid.css';

interface WaferGridProps {
  wafer: Wafer;
  onNodeClick: (node: WaferNode) => void;
}

export function WaferGrid({ wafer, onNodeClick }: WaferGridProps) {
  /** Build the 2D grid and a Set of node IDs that fall inside the circle. */
  const { grid: nodes, insideCircle, displayLabels } = useMemo(() => {
    const grid: WaferNode[][] = [];
    const inside = new Set<string>();

    // Center of the grid (continuous coords)
    const centerR = (wafer.rows - 1) / 2;
    const centerC = (wafer.cols - 1) / 2;
    // Radius — use the smaller half-dimension so the circle fits
    const radius = Math.min(wafer.rows, wafer.cols) / 2;

    for (let r = 0; r < wafer.rows; r++) {
      const row: WaferNode[] = [];
      for (let c = 0; c < wafer.cols; c++) {
        const id = `R${r}C${c}`;
        row.push(wafer.nodes[id]);

        // Distance from center (euclidean)
        const dr = r - centerR;
        const dc = c - centerC;
        if (Math.sqrt(dr * dr + dc * dc) <= radius) {
          inside.add(id);
        }
      }
      grid.push(row);
    }

    // Build sequential display labels for visible nodes only
    const labels = new Map<string, string>();
    let visibleRow = 0;
    for (let r = 0; r < wafer.rows; r++) {
      let visibleCol = 0;
      let rowHasVisible = false;
      for (let c = 0; c < wafer.cols; c++) {
        const id = `R${r}C${c}`;
        if (inside.has(id)) {
          labels.set(id, `R${visibleRow}C${visibleCol}`);
          visibleCol++;
          rowHasVisible = true;
        }
      }
      if (rowHasVisible) visibleRow++;
    }

    return { grid, insideCircle: inside, displayLabels: labels };
  }, [wafer]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of qualityLevels) counts[q] = 0;
    for (const node of Object.values(wafer.nodes)) {
      if (insideCircle.has(node.id)) {
        counts[node.quality]++;
      }
    }
    return counts;
  }, [wafer, insideCircle]);

  return (
    <div className="wafer-grid-container">
      <h2>{wafer.name}</h2>
      <p className="subtitle">
        {wafer.rows} &times; {wafer.cols} grid &middot; {insideCircle.size} nodes
      </p>

      {/* Legend */}
      <div className="quality-legend">
        {qualityLevels.map((q) => (
          <div key={q} className="quality-legend-item">
            <span className="quality-legend-swatch" style={{ background: qualityColorMap[q] }} />
            {qualityLabelMap[q]}
          </div>
        ))}
      </div>

      {/* Circular wafer */}
      <div className="wafer-disc">
        <div className="wafer-grid" style={{ gridTemplateColumns: `repeat(${wafer.cols}, 52px)` }}>
          {nodes.map((row) =>
            row.map((node) => {
              const visible = insideCircle.has(node.id);
              const label = displayLabels.get(node.id) ?? node.id;
              return (
                <button
                  key={node.id}
                  className={`wafer-node${visible ? '' : ' wafer-node-hidden'}`}
                  style={{ background: visible ? qualityColorMap[node.quality] : 'transparent' }}
                  onClick={() => visible && onNodeClick(node)}
                  title={visible ? `${label} — ${qualityLabelMap[node.quality]}` : undefined}
                  aria-label={visible ? `Node ${label}, quality: ${node.quality}` : undefined}
                  tabIndex={visible ? 0 : -1}
                >
                  {visible && <span className="node-label">{label}</span>}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="wafer-stats">
        {qualityLevels.map((q) => (
          <div key={q} className="wafer-stat">
            <div className="stat-value" style={{ color: qualityColorMap[q] }}>
              {stats[q]}
            </div>
            <div className="stat-label">{qualityLabelMap[q]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
