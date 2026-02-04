import React, { useState, useEffect } from 'react';
import { Zap, DollarSign, Leaf, TrendingUp, Award } from 'lucide-react';

const EnergySavingsDashboard = ({ cells }) => {
    const [metrics, setMetrics] = useState({
        energySaved: 0,
        costSavings: 0,
        co2Reduced: 0,
        efficiencyGain: 0
    });

    const [displayMetrics, setDisplayMetrics] = useState({
        energySaved: 0,
        costSavings: 0,
        co2Reduced: 0,
        efficiencyGain: 0
    });

    useEffect(() => {
        // Calculate metrics based on cell data
        const cellArray = Object.values(cells);
        const totalCells = cellArray.length;

        if (totalCells === 0) return;

        // Calculate cells that are optimized (switched off or low utilization)
        const optimizedCells = cellArray.filter(
            cell => cell.action === 'SWITCH OFF' || cell.utilization < 30
        ).length;

        // Energy savings calculation (approximate values for demo)
        const avgPowerPerCell = 2.5; // kW per cell
        const hoursPerDay = 24;
        const savingsRatio = optimizedCells / Math.max(totalCells, 1);

        const energySaved = avgPowerPerCell * optimizedCells * hoursPerDay; // kWh per day
        const costPerKwh = 0.12; // USD per kWh
        const costSavings = energySaved * costPerKwh;
        const co2PerKwh = 0.5; // kg CO2 per kWh
        const co2Reduced = energySaved * co2PerKwh;
        const efficiencyGain = savingsRatio * 100;

        setMetrics({
            energySaved: Math.round(energySaved * 10) / 10,
            costSavings: Math.round(costSavings * 100) / 100,
            co2Reduced: Math.round(co2Reduced * 10) / 10,
            efficiencyGain: Math.round(efficiencyGain * 10) / 10
        });
    }, [cells]);

    // Animated counter effect
    useEffect(() => {
        const duration = 1500; // 1.5 seconds
        const steps = 60;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            setDisplayMetrics({
                energySaved: metrics.energySaved * progress,
                costSavings: metrics.costSavings * progress,
                co2Reduced: metrics.co2Reduced * progress,
                efficiencyGain: metrics.efficiencyGain * progress
            });

            if (currentStep >= steps) {
                clearInterval(interval);
                setDisplayMetrics(metrics);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [metrics]);



    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Hero Banner */}
            <div className="glass-card" style={{
                padding: '2rem',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Award size={32} style={{ color: 'var(--accent-energy)', animation: 'float 3s ease-in-out infinite' }} />
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        margin: 0,
                        background: 'linear-gradient(90deg, var(--accent-energy), var(--accent-cyan))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        O-RAN Energy Optimization Impact
                    </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                    Real-time savings powered by intelligent rApp decision-making
                </p>
            </div>

            {/* Metrics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                <MetricCard
                    icon={Zap}
                    value={displayMetrics.energySaved}
                    unit="kWh"
                    label="Energy Saved Today"
                    color="var(--accent-yellow)"
                    glow="var(--accent-yellow-glow)"
                    trend="+12.5% vs yesterday"
                />
                <MetricCard
                    icon={DollarSign}
                    value={displayMetrics.costSavings}
                    unit="USD"
                    label="Cost Reduction"
                    color="var(--accent-green)"
                    glow="var(--accent-green-glow)"
                    trend="+8.3% savings rate"
                />
                <MetricCard
                    icon={Leaf}
                    value={displayMetrics.co2Reduced}
                    unit="kg CO₂"
                    label="Carbon Footprint Avoided"
                    color="var(--accent-energy)"
                    glow="var(--accent-green-glow)"
                    trend="Green initiative"
                />
                <MetricCard
                    icon={TrendingUp}
                    value={displayMetrics.efficiencyGain}
                    unit="%"
                    label="Network Efficiency Gain"
                    color="var(--accent-cyan)"
                    glow="var(--accent-cyan-glow)"
                    trend="Optimal performance"
                />
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, value, unit, label, color, glow, trend }) => (
    <div className="glass-card" style={{
        padding: '1.5rem',
        borderColor: `${color}40`,
        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        animation: 'slideIn 0.5s ease-out'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${glow}`,
            }}>
                <Icon size={28} style={{ color: color }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    marginBottom: '0.25rem'
                }}>
                    {label}
                </div>
                {trend && (
                    <div style={{
                        fontSize: '0.7rem',
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <TrendingUp size={12} />
                        <span>{trend}</span>
                    </div>
                )}
            </div>
        </div>

        <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: color,
            lineHeight: 1,
            textShadow: `0 0 20px ${glow}`,
            fontFamily: 'monospace'
        }}>
            {value.toFixed(value < 10 ? 2 : 1)}
            <span style={{
                fontSize: '1rem',
                marginLeft: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: 400
            }}>
                {unit}
            </span>
        </div>
    </div>
);

export default EnergySavingsDashboard;
