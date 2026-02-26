import type { IWaferDataSource } from './IWaferDataSource';
import type { Wafer, WaferNode, WaferSummary, NodeQuality } from '../types';

/**
 * In-memory (cache) implementation of IWaferDataSource.
 *
 * Data lives only in the browser tab's memory.
 * Optionally persists to localStorage so data survives page reloads.
 */
export class CacheDataSource implements IWaferDataSource {
  private wafers: Map<string, Wafer> = new Map();
  private readonly storageKey = 'wafertracker_data';
  private readonly persist: boolean;

  constructor(options?: { persist?: boolean }) {
    this.persist = options?.persist ?? true;
    this.load();
  }

  // ── Helpers ──────────────────────────────────────────────────

  private generateId(): string {
    return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private save(): void {
    if (!this.persist) return;
    try {
      const data = Object.fromEntries(this.wafers);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      /* storage full or unavailable – silently continue */
    }
  }

  private load(): void {
    if (!this.persist) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Wafer>;
      this.wafers = new Map(Object.entries(parsed));
    } catch {
      /* corrupt data – start fresh */
    }
  }

  private buildNodeId(row: number, col: number): string {
    return `R${row}C${col}`;
  }

  private computeSummary(wafer: Wafer): WaferSummary {
    const qualityCounts: Record<NodeQuality, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      fail: 0,
      untested: 0,
    };
    for (const node of Object.values(wafer.nodes)) {
      qualityCounts[node.quality]++;
    }
    return {
      id: wafer.id,
      name: wafer.name,
      rows: wafer.rows,
      cols: wafer.cols,
      totalNodes: Object.keys(wafer.nodes).length,
      qualityCounts,
      createdAt: wafer.createdAt,
      updatedAt: wafer.updatedAt,
    };
  }

  // ── Wafer CRUD ───────────────────────────────────────────────

  async listWafers(): Promise<WaferSummary[]> {
    return Array.from(this.wafers.values()).map((w) => this.computeSummary(w));
  }

  async getWafer(waferId: string): Promise<Wafer | null> {
    const wafer = this.wafers.get(waferId);
    if (!wafer) return null;
    // Return a deep copy so React detects changes via new references
    return JSON.parse(JSON.stringify(wafer)) as Wafer;
  }

  async createWafer(name: string, rows: number, cols: number): Promise<Wafer> {
    const now = new Date().toISOString();
    const id = this.generateId();
    const nodes: Record<string, WaferNode> = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nodeId = this.buildNodeId(r, c);
        nodes[nodeId] = {
          id: nodeId,
          row: r,
          col: c,
          quality: 'untested',
          notes: '',
          lastUpdated: now,
        };
      }
    }

    const wafer: Wafer = { id, name, rows, cols, nodes, createdAt: now, updatedAt: now };
    this.wafers.set(id, wafer);
    this.save();
    return wafer;
  }

  async deleteWafer(waferId: string): Promise<void> {
    this.wafers.delete(waferId);
    this.save();
  }

  async renameWafer(waferId: string, newName: string): Promise<Wafer> {
    const wafer = this.wafers.get(waferId);
    if (!wafer) throw new Error(`Wafer ${waferId} not found`);
    wafer.name = newName;
    wafer.updatedAt = new Date().toISOString();
    this.save();
    return wafer;
  }

  // ── Node operations ──────────────────────────────────────────

  async getNode(waferId: string, nodeId: string): Promise<WaferNode | null> {
    const wafer = this.wafers.get(waferId);
    if (!wafer) return null;
    return wafer.nodes[nodeId] ?? null;
  }

  async updateNode(
    waferId: string,
    nodeId: string,
    updates: Partial<Pick<WaferNode, 'quality' | 'notes'>>,
  ): Promise<WaferNode> {
    const wafer = this.wafers.get(waferId);
    if (!wafer) throw new Error(`Wafer ${waferId} not found`);
    const node = wafer.nodes[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found on wafer ${waferId}`);

    if (updates.quality !== undefined) node.quality = updates.quality;
    if (updates.notes !== undefined) node.notes = updates.notes;
    node.lastUpdated = new Date().toISOString();
    wafer.updatedAt = node.lastUpdated;

    this.save();
    return node;
  }

  async batchUpdateQuality(
    waferId: string,
    updates: { nodeId: string; quality: NodeQuality }[],
  ): Promise<void> {
    const wafer = this.wafers.get(waferId);
    if (!wafer) throw new Error(`Wafer ${waferId} not found`);

    const now = new Date().toISOString();
    for (const { nodeId, quality } of updates) {
      const node = wafer.nodes[nodeId];
      if (node) {
        node.quality = quality;
        node.lastUpdated = now;
      }
    }
    wafer.updatedAt = now;
    this.save();
  }

  // ── Export ───────────────────────────────────────────────────

  /** Return all stored data as a JSON string. */
  exportData(): string {
    const data = Object.fromEntries(this.wafers);
    return JSON.stringify(data, null, 2);
  }

  /** Import data from a JSON string, merging into current storage. */
  importData(json: string): void {
    const parsed = JSON.parse(json) as Record<string, Wafer>;
    for (const [id, wafer] of Object.entries(parsed)) {
      this.wafers.set(id, wafer);
    }
    this.save();
  }
}
