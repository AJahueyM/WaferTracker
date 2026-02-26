import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { WaferSummary } from '../types';
import { useDataSource } from '../context/DataSourceContext';
import { CacheDataSource } from '../data/CacheDataSource';
import './Sidebar.css';

interface SidebarProps {
  wafers: WaferSummary[];
  activeWaferId: string | null;
  onCreate: (name: string, rows: number, cols: number) => void;
  onDelete: (id: string) => void;
  onImport?: () => void;
}

/* Simple inline SVG icons */
const WaferIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="5" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function Sidebar({ wafers, activeWaferId, onCreate, onDelete, onImport }: SidebarProps) {
  const ds = useDataSource();
  const isCacheSource = ds instanceof CacheDataSource;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rows, setRows] = useState('8');
  const [cols, setCols] = useState('8');

  const handleExport = useCallback(() => {
    if (!(ds instanceof CacheDataSource)) return;
    const json = ds.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wafertracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ds]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !(ds instanceof CacheDataSource)) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          ds.importData(reader.result as string);
          onImport?.();
        } catch {
          /* invalid JSON – ignore */
        }
      };
      reader.readAsText(file);
      // Reset so the same file can be re-imported
      e.target.value = '';
    },
    [ds, onImport],
  );

  const handleCreate = () => {
    const r = parseInt(rows, 10);
    const c = parseInt(cols, 10);
    if (!name.trim() || isNaN(r) || isNaN(c) || r < 1 || c < 1) return;
    onCreate(name.trim(), r, c);
    setName('');
    setRows('8');
    setCols('8');
    setShowForm(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span className="logo-icon">W</span>
          WaferTracker
        </h1>
        <button className="btn-icon" onClick={() => setShowForm(!showForm)} title="New wafer">
          <PlusIcon />
        </button>
      </div>

      {/* Wafer list */}
      <div className="wafer-list">
        {wafers.length === 0 && (
          <div className="sidebar-empty">No wafers yet. Create one to get started.</div>
        )}
        {wafers.map((w) => (
          <Link
            key={w.id}
            className={`wafer-list-item ${w.id === activeWaferId ? 'active' : ''}`}
            to={`/wafer/${w.id}`}
          >
            <div className="wafer-list-icon">
              <WaferIcon />
            </div>
            <div className="wafer-list-info">
              <div className="wafer-list-name">{w.name}</div>
              <div className="wafer-list-meta">
                {w.rows}&times;{w.cols} &middot; {w.totalNodes} nodes
              </div>
            </div>
            <button
              className="btn-icon wafer-list-delete"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(w.id);
              }}
              title="Delete wafer"
            >
              <TrashIcon />
            </button>
          </Link>
        ))}
      </div>

      {/* Export / Import buttons */}
      {isCacheSource && (
        <div className="sidebar-export">
          <div className="sidebar-export-buttons">
            <button className="btn-export" onClick={handleExport} title="Export data as JSON">
              <DownloadIcon />
              Export
            </button>
            <button className="btn-export" onClick={handleImport} title="Import data from JSON">
              <UploadIcon />
              Import
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="create-wafer-form">
          <h4>New Wafer</h4>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Wafer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-row">
            <input
              className="form-input"
              type="number"
              placeholder="Rows"
              min={1}
              max={50}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
            />
            <input
              className="form-input"
              type="number"
              placeholder="Cols"
              min={1}
              max={50}
              value={cols}
              onChange={(e) => setCols(e.target.value)}
            />
          </div>
          <button className="btn-create" onClick={handleCreate} disabled={!name.trim()}>
            Create Wafer
          </button>
        </div>
      )}
    </aside>
  );
}
