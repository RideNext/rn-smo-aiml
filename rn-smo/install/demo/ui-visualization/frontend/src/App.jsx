import React, { useState, useEffect, useRef } from 'react';
import { Zap, Activity } from 'lucide-react';
import CellCard from './components/CellCard';
import TopologyView from './components/TopologyView';
import StatsPanel from './components/StatsPanel';
import Sidebar from './components/Sidebar';
import DmeView from './components/DmeView';
import PolicyView from './components/PolicyView';
import EnergySavingsDashboard from './components/EnergySavingsDashboard';
import DemoControls from './components/DemoControls';
import DataPersistencePanel from './components/DataPersistencePanel';
import { useCellHistory, useSessionRecovery } from './hooks/useLocalStorage';
import './index.css';

const WS_URL = `ws://${window.location.host}/ws`;

function App() {
  const [cells, setCells] = useState({});
  const [history, setHistory] = useState({});
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  // Persistence hooks
  const { history: persistedHistory, addEntry: addHistoryEntry, clearHistory, exportData } = useCellHistory();
  const { hasSession, lastSession, saveSession, clearSession } = useSessionRecovery();

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('Connected to WebSocket');
        setConnected(true);
      };

      ws.current.onclose = () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
        // Reconnect after 2 seconds
        setTimeout(connect, 2000);
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'init' || message.type === 'update' || message.type === 'sync') {
          const dataList = message.data;

          setCells(prev => {
            const newCells = { ...prev };
            dataList.forEach(item => {
              newCells[item.cell_id] = item;
              // Add to persisted history
              addHistoryEntry(item.cell_id, item);
            });
            return newCells;
          });

          setHistory(prev => {
            const newHistory = { ...prev };
            dataList.forEach(item => {
              const cellHistory = newHistory[item.cell_id] ? [...newHistory[item.cell_id]] : [];
              cellHistory.push({
                timestamp: item.timestamp,
                utilization: item.utilization
              });
              if (cellHistory.length > 50) cellHistory.shift();
              newHistory[item.cell_id] = cellHistory;
            });
            return newHistory;
          });
        }
      };
    };

    connect();
    return () => { if (ws.current) ws.current.close(); };
  }, [addHistoryEntry]);


  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'topology':
        return (
          <div className="topology-section" style={{ height: 'calc(100vh - 100px)' }}>
            <TopologyView cells={cells} />
          </div>
        );
      case 'dme':
        return <DmeView />;
      case 'policy':
        return <PolicyView />;
      case 'alerts':
        return (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="card-title">System Alerts</div>
            <p style={{ color: 'var(--text-secondary)' }}>No active alerts. System operating normally.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="card-title">System Settings</div>
            <p style={{ color: 'var(--text-secondary)' }}>Configuration options will appear here.</p>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <>
            <EnergySavingsDashboard cells={cells} />
            <StatsPanel cells={cells} />

            <div className="card-title" style={{ marginBottom: '1rem' }}>Live Cell Monitoring</div>
            <main className="cells-grid">
              {Object.keys(cells).sort().map(cellId => (
                <CellCard
                  key={cellId}
                  cellId={cellId}
                  data={cells[cellId]}
                  history={history[cellId] || []}
                />
              ))}

              {Object.keys(cells).length === 0 && (
                <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                  <Zap size={48} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
                  <div className="card-title">Initializing Network Link...</div>
                </div>
              )}
            </main>
          </>
        );
    }
  };

  return (
    <>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title" style={{
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(59, 130, 246, 0.3)'
            }}>
              {currentView === 'dme'
                ? 'DME - Overview of RAN Energy Performance'
                : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h1>
            <div className="dashboard-subtitle">
              {currentView === 'dashboard'
                ? 'Real-time energy optimization powered by O-RAN rApp intelligence'
                : currentView === 'dme'
                  ? 'Data Management and Exposure - Producers and Consumers'
                  : currentView === 'policy'
                    ? 'Policy Management and Near RT RIC Configuration'
                    : currentView === 'topology'
                      ? 'Network Topology and Cell Relationships'
                      : 'Overview of RAN Energy Performance'}
            </div>
          </div>
          <div className={`status-badge ${connected ? 'blue' : 'red'}`}>
            <Activity size={16} />
            <span>{connected ? 'Live Data Streaming' : 'Reconnecting...'}</span>
          </div>
        </header>

        {renderContent()}
      </div>
    </>
  );
}

export default App;
