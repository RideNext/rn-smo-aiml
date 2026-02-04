import React from 'react';
import { RadioTower } from 'lucide-react';
import StatusBadge from './StatusBadge';
import UtilizationChart from './UtilizationChart';

const CellCard = ({ cellId, data, history }) => {
    const latest = data || { utilization: 0, action: 'NO ACTION', reason: '' };

    // Parse cell ID for display
    // Format: ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=1
    const parts = cellId.split(',');
    const duId = parts[0].split('=')[1];
    const cellNum = parts[2].split('=')[1];
    const displayId = `Cell ${cellNum}`;

    const utilColor = latest.utilization > 70 ? 'var(--accent-red)' :
        latest.utilization < 20 ? 'var(--accent-green)' : 'var(--accent-blue)';

    return (
        <div className="glass-card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RadioTower size={48} color={utilColor} />
                    </div>
                    <div>
                        <div className="card-title" style={{ marginBottom: 0 }}>{displayId}</div>
                        <div className="metric-label">{latest.global_cell_id || duId}</div>
                    </div>
                </div>
                <StatusBadge action={latest.action} />
            </div>

            <div className="cell-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0', fontSize: '0.8rem' }}>
                <div>
                    <span className="metric-label">Sector:</span> <span style={{ color: 'var(--text-primary)' }}>{latest.sector_id || 'N/A'}</span>
                </div>
                <div>
                    <span className="metric-label">PCI:</span> <span style={{ color: 'var(--text-primary)' }}>{latest.pci || 'N/A'}</span>
                </div>
            </div>

            <div className="metric-value" style={{ color: utilColor }}>
                {latest.utilization.toFixed(1)}%
            </div>
            <div className="metric-label">Current Utilization</div>


            {history && history.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <UtilizationChart history={history} cellId={cellId} />
                </div>
            )}

            {latest.reason && (
                <div className="decision-context">
                    <div className="decision-label">
                        <span>Decision Logic</span>
                    </div>
                    <div className="decision-text">{latest.reason}</div>
                </div>
            )}
        </div>
    );
};

export default CellCard;
