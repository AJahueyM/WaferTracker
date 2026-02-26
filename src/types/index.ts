/**
 * Quality levels for wafer nodes.
 * Maps to color coding on the wafer grid view.
 */
export type NodeQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'fail' | 'untested';

/**
 * Represents a single node on a wafer.
 */
export interface WaferNode {
  /** Unique identifier for the node (e.g., "R3C5" for row 3, column 5) */
  id: string;
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Human-readable name/label for this node */
  name: string;
  /** Current quality classification */
  quality: NodeQuality;
  /** Optional notes about this node */
  notes: string;
  /** ISO timestamp of last update */
  lastUpdated: string;
}

/**
 * Represents a full wafer with its grid of nodes.
 */
export interface Wafer {
  /** Unique identifier for the wafer */
  id: string;
  /** Human-readable name/label */
  name: string;
  /** Number of rows in the node grid */
  rows: number;
  /** Number of columns in the node grid */
  cols: number;
  /** All nodes on this wafer, keyed by node id */
  nodes: Record<string, WaferNode>;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
}

/**
 * Summary stats for a wafer.
 */
export interface WaferSummary {
  id: string;
  name: string;
  rows: number;
  cols: number;
  totalNodes: number;
  qualityCounts: Record<NodeQuality, number>;
  createdAt: string;
  updatedAt: string;
}
