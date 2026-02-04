import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const UtilizationChart = ({ history, cellId }) => {
    if (!history || history.length === 0) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
            }}>
                No historical data available
            </div>
        );
    }

    // Format data for chart
    const chartData = history.map((item, index) => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }),
        utilization: item.utilization,
        timestamp: item.timestamp
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {data.time}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {data.utilization.toFixed(1)}%
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate stats
    const avgUtilization = chartData.reduce((sum, d) => sum + d.utilization, 0) / chartData.length;
    const maxUtilization = Math.max(...chartData.map(d => d.utilization));
    const minUtilization = Math.min(...chartData.map(d => d.utilization));

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
            {/* Chart Header */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Utilization Trend
                        </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Last {chartData.length} updates
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            AVERAGE
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {avgUtilization.toFixed(1)}%
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            PEAK
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                            {maxUtilization.toFixed(1)}%
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            MINIMUM
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                            {minUtilization.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                        <linearGradient id={`colorUtilization-${cellId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis
                        dataKey="time"
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.7rem' }}
                        tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.7rem' }}
                        tick={{ fill: 'var(--text-secondary)' }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="utilization"
                        stroke="var(--accent-blue)"
                        strokeWidth={2}
                        fill={`url(#colorUtilization-${cellId})`}
                        animationDuration={500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default UtilizationChart;
