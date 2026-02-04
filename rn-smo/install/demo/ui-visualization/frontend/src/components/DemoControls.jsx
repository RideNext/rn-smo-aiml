import React from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { useDemoScenario } from '../hooks/useLocalStorage';

const DemoControls = () => {
    const { scenario, switchScenario } = useDemoScenario();
    const demoRunning = scenario === 'optimization';

    const scenarios = [
        {
            id: 'baseline',
            name: 'Baseline Operation',
            icon: Pause,
            description: 'Network running without optimization',
            color: 'var(--accent-blue)'
        },
        {
            id: 'optimization',
            name: 'Enable Energy Optimization',
            icon: Sparkles,
            description: 'rApp actively managing energy policies',
            color: 'var(--accent-green)'
        },
        {
            id: 'reset',
            name: 'Reset Demo',
            icon: RotateCcw,
            description: 'Return to initial state',
            color: 'var(--accent-yellow)'
        }
    ];

    const handleScenario = (scenarioId) => {
        console.log(`Demo scenario: ${scenarioId}`);
        switchScenario(scenarioId);

        // Emit custom event for other components to react to
        window.dispatchEvent(new CustomEvent('demo-scenario-change', {
            detail: { scenario: scenarioId }
        }));
        // In a real implementation, this would trigger backend scenario changes
    };

    return (
        <div className="glass-card" style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: demoRunning ? 'var(--accent-green)' : 'var(--accent-yellow)',
                        boxShadow: demoRunning
                            ? '0 0 10px var(--accent-green-glow)'
                            : '0 0 10px var(--accent-yellow-glow)',
                        animation: demoRunning ? 'pulse 2s ease-in-out infinite' : 'none'
                    }} />
                    <div>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.125rem'
                        }}>
                            Demo Controls
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {demoRunning ? 'Optimization Active' : 'Ready for demonstration'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {scenarios.map(scenario => {
                        const Icon = scenario.icon;
                        return (
                            <button
                                key={scenario.id}
                                onClick={() => handleScenario(scenario.id)}
                                title={scenario.description}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    background: `${scenario.color}20`,
                                    border: `1px solid ${scenario.color}40`,
                                    borderRadius: '0.5rem',
                                    color: scenario.color,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 0 0 ${scenario.color}40`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${scenario.color}40`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 0 0 ${scenario.color}40`;
                                }}
                            >
                                <Icon size={16} />
                                <span>{scenario.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DemoControls;
