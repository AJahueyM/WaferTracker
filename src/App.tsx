import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import type { Wafer, WaferNode, WaferSummary, NodeQuality } from './types';
import { DataSourceProvider, useDataSource } from './context/DataSourceContext';
import { Sidebar } from './components/Sidebar';
import { WaferGrid } from './components/WaferGrid';
import { NodeEditModal } from './components/NodeEditModal';

function WaferApp() {
  const ds = useDataSource();
  const navigate = useNavigate();
  const { waferId } = useParams<{ waferId: string }>();

  const activeWaferId = waferId ?? null;

  const [wafers, setWafers] = useState<WaferSummary[]>([]);
  const [activeWafer, setActiveWafer] = useState<Wafer | null>(null);
  const [editingNode, setEditingNode] = useState<WaferNode | null>(null);

  // Load wafer list
  const refreshList = useCallback(async () => {
    const list = await ds.listWafers();
    setWafers(list);
  }, [ds]);

  // Load active wafer detail
  const loadWafer = useCallback(
    async (id: string) => {
      const wafer = await ds.getWafer(id);
      setActiveWafer(wafer);
    },
    [ds],
  );

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (activeWaferId) {
      loadWafer(activeWaferId);
    } else {
      setActiveWafer(null);
    }
  }, [activeWaferId, loadWafer]);

  const handleCreate = useCallback(
    async (name: string, rows: number, cols: number) => {
      const wafer = await ds.createWafer(name, rows, cols);
      await refreshList();
      navigate(`/wafer/${wafer.id}`);
    },
    [ds, refreshList, navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await ds.deleteWafer(id);
      if (activeWaferId === id) {
        navigate('/');
      }
      await refreshList();
    },
    [ds, activeWaferId, refreshList, navigate],
  );

  const handleNodeClick = useCallback((node: WaferNode) => {
    setEditingNode(node);
  }, []);

  const handleNodeSave = useCallback(
    async (updates: { quality: NodeQuality; notes: string }) => {
      if (!activeWaferId || !editingNode) return;
      await ds.updateNode(activeWaferId, editingNode.id, updates);
      await loadWafer(activeWaferId);
      await refreshList();
      setEditingNode(null);
    },
    [ds, activeWaferId, editingNode, loadWafer, refreshList],
  );

  return (
    <div className="app-layout">
      <Sidebar
        wafers={wafers}
        activeWaferId={activeWaferId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onImport={refreshList}
      />

      <main className="main-content">
        {activeWafer ? (
          <WaferGrid wafer={activeWafer} onNodeClick={handleNodeClick} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">⬡</div>
            <h2>No wafer selected</h2>
            <p>Select a wafer from the sidebar or create a new one to start tracking node quality.</p>
          </div>
        )}
      </main>

      {editingNode && (
        <NodeEditModal
          node={editingNode}
          onSave={handleNodeSave}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <DataSourceProvider>
      <Routes>
        <Route path="/" element={<WaferApp />} />
        <Route path="/wafer/:waferId" element={<WaferApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataSourceProvider>
  );
}

export default App;
