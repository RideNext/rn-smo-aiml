import { ImpactKPIs, KPIMetric } from '../types';
import { KPICalculator } from '../adapters';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

interface KPIDashboardProps {
    kpis: ImpactKPIs;
    variant?: 'full' | 'compact';
}

/**
 * KPIDashboard - Visual dashboard showing all impact KPIs
 */
export const KPIDashboard = ({ kpis, variant = 'full' }: KPIDashboardProps) => {
    if (variant === 'compact') {
        return <KPIMiniDashboard kpis={kpis} />;
    }

    const metrics = [
        { key: 'deploymentSuccessRate', label: 'Deployment Success', metric: kpis.deploymentSuccessRate },
        { key: 'resourceUtilization', label: 'Resource Utilization', metric: kpis.resourceUtilization },
        { key: 'availabilityScore', label: 'Availability', metric: kpis.availabilityScore },
        { key: 'governanceCompliance', label: 'Governance', metric: kpis.governanceCompliance },
        { key: 'instanceHealth', label: 'Instance Health', metric: kpis.instanceHealth },
    ];

    return (
        <div className="space-y-4">
            {/* Overall Trend */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Overall Trend
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Based on recent deployment history
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span
                        className="text-2xl font-bold"
                        style={{ color: KPICalculator.getTrendColor(kpis.trend) }}
                    >
                        {KPICalculator.getTrendIcon(kpis.trend)}
                    </span>
                    <span
                        className="text-lg font-medium capitalize"
                        style={{ color: KPICalculator.getTrendColor(kpis.trend) }}
                    >
                        {kpis.trend}
                    </span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map(({ key, label, metric }) => (
                    <KPICard key={key} label={label} metric={metric} />
                ))}
            </div>

            {/* Last Updated */}
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Last calculated: {new Date(kpis.lastCalculated).toLocaleString()}
            </p>
        </div>
    );
};

/**
 * Individual KPI Card
 */
const KPICard = ({ label, metric }: { label: string; metric: KPIMetric }) => {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                </h4>
                {metric.trend && <TrendIcon trend={metric.trend} />}
            </div>

            {/* Radial Progress */}
            <div className="flex items-center space-x-4">
                <RadialProgress value={metric.value} color={metric.color} size={60} />
                <div className="flex-1">
                    <div className="text-2xl font-bold" style={{ color: metric.color }}>
                        {metric.value}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {metric.label}
                    </div>
                </div>
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                {metric.description}
            </p>
        </div>
    );
};

/**
 * Radial Progress Circle
 */
const RadialProgress = ({ value, color, size }: { value: number; color: string; size: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
            />
        </svg>
    );
};

/**
 * Trend Icon
 */
const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    const icons = {
        up: <FiTrendingUp className="text-green-500" />,
        down: <FiTrendingDown className="text-red-500" />,
        stable: <FiMinus className="text-gray-500" />,
    };

    return <div className="text-sm">{icons[trend]}</div>;
};

/**
 * Compact KPI Dashboard (for card previews)
 */
export const KPIMiniDashboard = ({ kpis }: { kpis: ImpactKPIs }) => {
    const metrics = [
        kpis.deploymentSuccessRate,
        kpis.resourceUtilization,
        kpis.instanceHealth,
    ];

    return (
        <div className="flex items-center space-x-2">
            {metrics.map((metric, idx) => (
                <div
                    key={idx}
                    className="flex items-center space-x-1 px-2 py-1 rounded"
                    style={{ backgroundColor: `${metric.color}20` }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: metric.color }}
                    />
                    <span className="text-xs font-medium" style={{ color: metric.color }}>
                        {metric.value}%
                    </span>
                </div>
            ))}
            <div className="text-xs" style={{ color: KPICalculator.getTrendColor(kpis.trend) }}>
                {KPICalculator.getTrendIcon(kpis.trend)}
            </div>
        </div>
    );
};
