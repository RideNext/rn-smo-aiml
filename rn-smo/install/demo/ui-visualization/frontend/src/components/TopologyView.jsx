import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TopologyView = ({ cells }) => {
    // Get first 3 cells and select first one by default
    const cellEntries = Object.entries(cells).slice(0, 3);
    const [selectedCell, setSelectedCell] = useState(cellEntries.length > 0 ? cellEntries[0][0] : null);

    // Fixed locations in Bangalore, India
    const bangaloreLocations = [
        { lat: 12.9716, lng: 77.5946 }, // Central Bangalore
        { lat: 12.9352, lng: 77.6245 }, // Whitefield
        { lat: 13.0358, lng: 77.5970 }  // Yelahanka
    ];

    const cellsWithLocations = useMemo(() => {
        return cellEntries.map(([id, cell], index) => ({
            ...cell,
            id,
            lat: bangaloreLocations[index].lat,
            lng: bangaloreLocations[index].lng
        }));
    }, [cellEntries.map(([id]) => id).join(',')]);

    const createHexagonIcon = (cell) => {
        const isActive = cell.action !== 'SWITCH OFF';
        const color = isActive ? '#10b981' : '#ef4444';
        const utilColor = cell.utilization < 30 ? '#ef4444' : 
                         cell.utilization < 60 ? '#f59e0b' : 
                         cell.utilization < 85 ? '#10b981' : '#8b5cf6';
        
        const svg = `
            <svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <polygon points="30,5 50,17.5 50,42.5 30,55 10,42.5 10,17.5" 
                         fill="${color}" 
                         stroke="${utilColor}" 
                         stroke-width="3" 
                         filter="url(#glow)"
                         opacity="${isActive ? '0.9' : '0.5'}"/>
                <text x="30" y="32" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                    ${Math.round(cell.utilization)}%
                </text>
                <circle cx="30" cy="12" r="4" fill="${isActive ? '#fff' : '#666'}" 
                        opacity="${isActive ? '1' : '0.5'}">
                    ${isActive ? '<animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>' : ''}
                </circle>
            </svg>
        `;
        
        return L.divIcon({
            html: svg,
            className: 'hexagon-marker',
            iconSize: [60, 70],
            iconAnchor: [30, 35]
        });
    };

    const CellDetailPanel = ({ cell }) => {
        const cellName = cell.id.split(',').pop().replace('NRCellDU=', '');
        const isActive = cell.action !== 'SWITCH OFF';
        
        // Generate unique metrics based on cell ID
        const cellHash = cell.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const metrics = {
            power: Math.round(20 + (cellHash % 25)),
            signalStrength: Math.round(-100 + ((cellHash * 7) % 40)),
            temperature: Math.round(35 + ((cellHash * 13) % 20)),
            uptime: Math.floor((cellHash * 17) % 720)
        };

        const getStatusColor = () => isActive ? '#10b981' : '#ef4444';
        const getUtilColor = () => {
            if (cell.utilization < 30) return '#ef4444';
            if (cell.utilization < 60) return '#f59e0b';
            if (cell.utilization < 85) return '#10b981';
            return '#8b5cf6';
        };

        const CellTowerIcon = () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20"/>
                <path d="M8 6l4-4 4 4"/>
                <path d="M6 10l6-6 6 6"/>
                <path d="M4 14l8-8 8 8"/>
                <path d="M2 18l10-10 10 10"/>
            </svg>
        );

        const InfoCard = ({ icon, label, value, unit, color }) => (
            <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {label}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || '#1e293b' }}>
                    {value}
                </div>
                {unit && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{unit}</div>}
            </div>
        );

        return (
            <div style={{ 
                width: '380px', 
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{ 
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px 12px 0 0',
                    borderBottom: '2px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                                <CellTowerIcon />
                                {cellName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                ID: {cell.global_cell_id || 'N/A'}
                            </div>
                            {/* Status Badge - Dashboard Style */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: isActive ? '#dcfce7' : '#fee2e2',
                                border: `1px solid ${getStatusColor()}`,
                                borderRadius: '6px'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: getStatusColor(),
                                    boxShadow: `0 0 8px ${getStatusColor()}`
                                }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: getStatusColor() }}>
                                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedCell(null)}
                            style={{
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >×</button>
                    </div>
                    {/* Cell DN Path */}
                    <div style={{
                        background: '#f8fafc',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        lineHeight: '1.5',
                        color: '#475569'
                    }}>
                        {cell.id}
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Load */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                            📊 RESOURCE LOAD
                        </div>
                        <div style={{
                            background: 'white',
                            border: `2px solid ${getUtilColor()}`,
                            borderRadius: '8px',
                            padding: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getUtilColor() }}>
                                {cell.utilization.toFixed(1)}%
                            </div>
                            <div style={{
                                width: '100%',
                                height: '8px',
                                background: '#e2e8f0',
                                borderRadius: '4px',
                                marginTop: '1rem',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${cell.utilization}%`,
                                    height: '100%',
                                    background: getUtilColor(),
                                    transition: 'width 0.5s'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                            ⚡ POWER & SIGNAL
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <InfoCard 
                                icon="⚡" 
                                label="TX Power" 
                                value={metrics.power} 
                                unit="dBm"
                                color="#f59e0b"
                            />
                            <InfoCard 
                                icon="📶" 
                                label="Signal" 
                                value={metrics.signalStrength} 
                                unit="dBm"
                                color="#3b82f6"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                            🌡️ ENVIRONMENT & UPTIME
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <InfoCard 
                                icon="🌡️" 
                                label="Temperature" 
                                value={`${metrics.temperature}°C`}
                                color={metrics.temperature > 50 ? '#ef4444' : '#10b981'}
                            />
                            <InfoCard 
                                icon="⏱️" 
                                label="Uptime" 
                                value={`${Math.floor(metrics.uptime / 24)}d ${metrics.uptime % 24}h`}
                                color="#8b5cf6"
                            />
                        </div>
                    </div>

                    {/* Timestamp */}
                    {cell.timestamp && (
                        <div style={{
                            marginTop: '1rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#94a3b8'
                        }}>
                            Last updated: {new Date(cell.timestamp).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const selectedCellData = selectedCell ? cellsWithLocations.find(c => c.id === selectedCell) : null;

    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: '100%', position: 'relative' }}>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer 
                    center={[12.9716, 77.5946]} 
                    zoom={11} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    {cellsWithLocations.map(cell => (
                        <Marker
                            key={cell.id}
                            position={[cell.lat, cell.lng]}
                            icon={createHexagonIcon(cell)}
                            eventHandlers={{
                                click: () => setSelectedCell(cell.id)
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: '150px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {cell.id.split(',').pop().replace('NRCellDU=', '')}
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        Utilization: {cell.utilization.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        Status: {cell.action !== 'SWITCH OFF' ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {selectedCellData && <CellDetailPanel cell={selectedCellData} />}
        </div>
    );
};

export default TopologyView;
