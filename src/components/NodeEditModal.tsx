import { useState, useEffect, useCallback } from 'react';
import type { WaferNode, NodeQuality } from '../types';
import { qualityColorMap, qualityLabelMap, qualityLevels } from '../utils/quality';
import './NodeEditModal.css';

interface NodeEditModalProps {
  node: WaferNode;
  onSave: (updates: { quality: NodeQuality; notes: string }) => void;
  onClose: () => void;
}

export function NodeEditModal({ node, onSave, onClose }: NodeEditModalProps) {
  const [quality, setQuality] = useState<NodeQuality>(node.quality);
  const [notes, setNotes] = useState(node.notes);

  // Sync if node changes externally
  useEffect(() => {
    setQuality(node.quality);
    setNotes(node.notes);
  }, [node]);

  const handleSave = useCallback(() => {
    onSave({ quality, notes });
  }, [quality, notes, onSave]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>
          Node {node.id}
        </h3>
        <p className="modal-subtitle">
          Row {node.row}, Column {node.col}
        </p>

        {/* Quality slider */}
        <div className="quality-slider-group">
          <div className="quality-slider-header">
            <span className="quality-slider-label">Quality</span>
            <span
              className="quality-slider-badge"
              style={{ background: qualityColorMap[quality] }}
            >
              {qualityLabelMap[quality]}
            </span>
          </div>
          <div className="quality-slider-track-wrapper">
            <input
              type="range"
              className="quality-slider"
              min={0}
              max={qualityLevels.length - 1}
              step={1}
              value={qualityLevels.indexOf(quality)}
              onChange={(e) => setQuality(qualityLevels[Number(e.target.value)])}
              style={{
                '--slider-color': qualityColorMap[quality],
              } as React.CSSProperties}
            />
            <div className="quality-slider-labels">
              {qualityLevels.map((q) => (
                <span
                  key={q}
                  className={`quality-slider-tick${quality === q ? ' active' : ''}`}
                  style={{ color: quality === q ? qualityColorMap[q] : undefined }}
                >
                  {qualityLabelMap[q]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <label className="node-notes-label">Notes</label>
        <textarea
          className="node-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add observations, measurements, or notes…"
        />

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>

        <div className="modal-meta">Last updated: {new Date(node.lastUpdated).toLocaleString()}</div>
      </div>
    </div>
  );
}
