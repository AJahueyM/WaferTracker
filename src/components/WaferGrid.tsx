import { useMemo, useState, useCallback } from 'react';
import type { Wafer, WaferNode } from '../types';
import { qualityColorMap, qualityLabelMap, qualityLevels } from '../utils/quality';
import './WaferGrid.css';

/* ── Group-layout constants ────────────────────────────────────────── */
export const GROUP_SIZE = 11;
/** Number of groups per group-row (top → bottom). */
export const GROUP_ROWS_PATTERN = [2, 6, 8, 8, 8, 6, 2];
export const MAX_GROUP_COLS = Math.max(...GROUP_ROWS_PATTERN); // 8

/** Total rows/cols needed to fill the full grouped layout. */
export const WAFER_ROWS = GROUP_ROWS_PATTERN.length * GROUP_SIZE; // 77
export const WAFER_COLS = MAX_GROUP_COLS * GROUP_SIZE;              // 88

const NODE_GAP = 1;   // px between nodes inside a group
const GROUP_GAP = 8;   // px between groups
const MIN_NODE_SIZE = 4;
const MAX_NODE_SIZE = 32;

/** Compute a base node size so the grouped layout fits the viewport. */
function computeBaseNodeSize(): number {
  const totalNodeCols = MAX_GROUP_COLS * GROUP_SIZE;
  const totalNodeRows = GROUP_ROWS_PATTERN.length * GROUP_SIZE;
  const gapH =
    (MAX_GROUP_COLS - 1) * GROUP_GAP +
    MAX_GROUP_COLS * (GROUP_SIZE - 1) * NODE_GAP;
  const gapV =
    (GROUP_ROWS_PATTERN.length - 1) * GROUP_GAP +
    GROUP_ROWS_PATTERN.length * (GROUP_SIZE - 1) * NODE_GAP;

  const maxW = Math.min(window.innerWidth * 0.85, 1800);
  const maxH = Math.min(window.innerHeight * 0.72, 1000);

  const sizeByW = (maxW - gapH) / totalNodeCols;
  const sizeByH = (maxH - gapV) / totalNodeRows;

  return Math.max(
    MIN_NODE_SIZE,
    Math.min(MAX_NODE_SIZE, Math.floor(Math.min(sizeByW, sizeByH))),
  );
}

/* ── Types ─────────────────────────────────────────────────────────── */
interface GroupInfo {
  groupRow: number;
  groupCol: number;
  /** 11×11 node matrix; null = position outside wafer bounds. */
  nodes: (WaferNode | null)[][];
}

interface WaferGridProps {
  wafer: Wafer;
  onNodeClick: (node: WaferNode) => void;
}

export function WaferGrid({ wafer, onNodeClick }: WaferGridProps) {
  /* ── Dynamic sizing ──────────────────────────────────────────────── */
  const baseSize = useMemo(() => computeBaseNodeSize(), []);
  const [zoom, setZoom] = useState(0);
  const nodeSize = Math.max(MIN_NODE_SIZE, Math.min(MAX_NODE_SIZE, baseSize + zoom));

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 2, MAX_NODE_SIZE - baseSize)),
    [baseSize],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 2, MIN_NODE_SIZE - baseSize)),
    [baseSize],
  );
  const zoomReset = useCallback(() => setZoom(0), []);

  /* ── Group layout computation ────────────────────────────────────── */
  const { groupRows, visibleCount } = useMemo(() => {
    const rows: GroupInfo[][] = [];
    let count = 0;

    for (let gr = 0; gr < GROUP_ROWS_PATTERN.length; gr++) {
      const numGroups = GROUP_ROWS_PATTERN[gr];
      const colOffset = (MAX_GROUP_COLS - numGroups) / 2;
      const row: GroupInfo[] = [];

      for (let gc = 0; gc < numGroups; gc++) {
        const actualGc = colOffset + gc;
        const startRow = gr * GROUP_SIZE;
        const startCol = actualGc * GROUP_SIZE;
        const nodes: (WaferNode | null)[][] = [];

        for (let r = 0; r < GROUP_SIZE; r++) {
          const nodeRow: (WaferNode | null)[] = [];
          for (let c = 0; c < GROUP_SIZE; c++) {
            const nr = startRow + r;
            const nc = startCol + c;
            const id = `R${nr}C${nc}`;
            if (nr < wafer.rows && nc < wafer.cols && wafer.nodes[id]) {
              nodeRow.push(wafer.nodes[id]);
              count++;
            } else {
              nodeRow.push(null);
            }
          }
          nodes.push(nodeRow);
        }

        row.push({ groupRow: gr, groupCol: gc, nodes });
      }

      rows.push(row);
    }

    return { groupRows: rows, visibleCount: count };
  }, [wafer]);

  /* ── Stats ───────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of qualityLevels) counts[q] = 0;
    for (const gRow of groupRows) {
      for (const group of gRow) {
        for (const nodeRow of group.nodes) {
          for (const node of nodeRow) {
            if (node) counts[node.quality]++;
          }
        }
      }
    }
    return counts;
  }, [groupRows]);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="wafer-grid-container">
      <h2>{wafer.name}</h2>
      <p className="subtitle">
        {GROUP_ROWS_PATTERN.reduce((a, b) => a + b, 0)} groups &middot;{' '}
        {GROUP_SIZE}&times;{GROUP_SIZE} per group &middot; {visibleCount} nodes
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

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
        <button className="zoom-btn zoom-btn-reset" onClick={zoomReset} title="Reset zoom">
          {nodeSize}px
        </button>
        <button className="zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
      </div>

      {/* Grouped wafer layout */}
      <div className="wafer-groups" style={{ gap: `${GROUP_GAP}px` }}>
        {groupRows.map((gRow, grIdx) => (
          <div key={grIdx} className="wafer-group-row" style={{ gap: `${GROUP_GAP}px` }}>
            {gRow.map((group) => (
              <div
                key={`${group.groupRow}-${group.groupCol}`}
                className="wafer-group"
              >
                <div
                  className="wafer-group-grid"
                  style={{
                    gridTemplateColumns: `repeat(${GROUP_SIZE}, ${nodeSize}px)`,
                    gap: `${NODE_GAP}px`,
                  }}
                >
                  {group.nodes.flat().map((node, i) => {
                    if (!node) {
                      return (
                        <div
                          key={`empty-${i}`}
                          className="wafer-node-placeholder"
                          style={{ width: nodeSize, height: nodeSize }}
                        />
                      );
                    }
                    return (
                      <button
                        key={node.id}
                        className="wafer-node"
                        style={{
                          width: nodeSize,
                          height: nodeSize,
                          background: qualityColorMap[node.quality],
                          borderRadius: nodeSize < 12 ? 2 : nodeSize < 20 ? 3 : 4,
                        }}
                        onClick={() => onNodeClick(node)}
                        title={`${node.id} — ${qualityLabelMap[node.quality]}`}
                        aria-label={`Node ${node.id}, quality: ${node.quality}`}
                      >
                        {nodeSize >= 28 && <span className="node-label">{node.id}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
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
