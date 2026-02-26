import type { Wafer, WaferNode, WaferSummary, NodeQuality } from '../types';

/**
 * Abstract data source interface.
 *
 * All data operations go through this interface so the underlying
 * storage can be swapped without changing any UI code.
 *
 * Implementations must handle their own persistence lifecycle.
 */
export interface IWaferDataSource {
  // ── Wafer CRUD ──────────────────────────────────────────────

  /** Return summary list of all wafers. */
  listWafers(): Promise<WaferSummary[]>;

  /** Get a full wafer by id (including all nodes). */
  getWafer(waferId: string): Promise<Wafer | null>;

  /** Create a new wafer with the given dimensions. Returns the created wafer. */
  createWafer(name: string, rows: number, cols: number): Promise<Wafer>;

  /** Delete a wafer and all its nodes. */
  deleteWafer(waferId: string): Promise<void>;

  /** Rename a wafer. */
  renameWafer(waferId: string, newName: string): Promise<Wafer>;

  // ── Node operations ─────────────────────────────────────────

  /** Get a single node. */
  getNode(waferId: string, nodeId: string): Promise<WaferNode | null>;

  /** Update a node's quality, name, and/or notes. Returns the updated node. */
  updateNode(
    waferId: string,
    nodeId: string,
    updates: Partial<Pick<WaferNode, 'quality' | 'name' | 'notes'>>,
  ): Promise<WaferNode>;

  /** Batch-set quality for multiple nodes at once. */
  batchUpdateQuality(
    waferId: string,
    updates: { nodeId: string; quality: NodeQuality }[],
  ): Promise<void>;
}
