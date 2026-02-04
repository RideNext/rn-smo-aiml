import React from 'react';
import { Zap, Activity, AlertTriangle, Server } from 'lucide-react';

const StatsPanel = ({ cells }) => {
    const cellList = Object.values(cells);
    const totalCells = cellList.length;
    const activeCells = cellList.filter(c => c.action === 'SWITCH ON' || c.action === 'NO ACTION').length;
    const savingCells = cellList.filter(c => c.action === 'SWITCH OFF').length;

    // Calculate average utilization
    const avgUtil = totalCells > 0
        ? cellList.reduce((acc, curr) => acc + curr.utilization, 0) / totalCells
        : 0;

    return (
        <div className="stats-grid">
            <div className="glass-card stat-card">
                <div className="stat-icon" style={{ color: 'var(--accent-blue)' }}>
                    <Server size={24} />
                </div>
                <div>
                    <div className="stat-value">{totalCells}</div>
                    <div className="stat-label">Total Cells</div>
                </div>
            </div>

            <div className="glass-card stat-card">
                <div className="stat-icon" style={{ color: 'var(--accent-green)' }}>
                    <Activity size={24} />
                </div>
                <div>
                    <div className="stat-value">{activeCells}</div>
                    <div className="stat-label">Active Cells</div>
                </div>
            </div>

            <div className="glass-card stat-card">
                <div className="stat-icon" style={{ color: 'var(--accent-yellow)' }}>
                    <Zap size={24} />
                </div>
                <div>
                    <div className="stat-value">{savingCells}</div>
                    <div className="stat-label">Power Saving Mode</div>
                </div>
            </div>

            <div className="glass-card stat-card">
                <div className="stat-icon" style={{ color: 'var(--accent-cyan)' }}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <div className="stat-value">{avgUtil.toFixed(1)}%</div>
                    <div className="stat-label">Avg Network Load</div>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
