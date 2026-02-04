import React from 'react';
import { Download, Trash2, CheckCircle } from 'lucide-react';

const DataPersistencePanel = ({ onExport, onClear, onRestore }) => {
    const [showConfirm, setShowConfirm] = React.useState(false);

    const handleClear = () => {
        if (showConfirm) {
            onClear();
            setShowConfirm(false);
        } else {
            setShowConfirm(true);
            setTimeout(() => setShowConfirm(false), 3000);
        }
    };

    return (
        <div className="glass-card" style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: 'rgba(168, 85, 247, 0.05)',
            borderColor: 'rgba(168, 85, 247, 0.2)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                    }}>
                        Data Management
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Export, restore, or clear historical data
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={onExport}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--accent-green)',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Download size={14} />
                        Export Data
                    </button>

                    {onRestore && (
                        <button
                            onClick={onRestore}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.875rem',
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '0.5rem',
                                color: 'var(--accent-blue)',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <CheckCircle size={14} />
                            Restore Session
                        </button>
                    )}

                    <button
                        onClick={handleClear}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            background: showConfirm ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${showConfirm ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.3)'}`,
                            borderRadius: '0.5rem',
                            color: 'var(--accent-red)',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Trash2 size={14} />
                        {showConfirm ? 'Confirm Clear?' : 'Clear Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataPersistencePanel;
