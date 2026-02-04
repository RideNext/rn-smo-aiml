import {
    Rapp,
    RappInstance,
    ImpactKPIs,
    KPIMetric,
} from '../types';
import { StateCache } from './StateCache';

/**
 * KPICalculator - Calculates impact KPIs from backend data and historical tracking
 * 
 * Computes 5 key metrics:
 * 1. Deployment Success Rate
 * 2. Resource Utilization
 * 3. Availability Score
 * 4. Governance Compliance
 * 5. Instance Health
 */
export class KPICalculator {
    /**
     * Calculate all KPIs for a rApp
     */
    static calculateKPIs(rapp: Rapp): ImpactKPIs {
        const deploymentSuccessRate = this.calculateDeploymentSuccessRate(rapp);
        const resourceUtilization = this.calculateResourceUtilization(rapp);
        const availabilityScore = this.calculateAvailabilityScore(rapp);
        const governanceCompliance = this.calculateGovernanceCompliance(rapp);
        const instanceHealth = this.calculateInstanceHealth(rapp);

        const trend = this.determineTrend(rapp);

        return {
            deploymentSuccessRate,
            resourceUtilization,
            availabilityScore,
            governanceCompliance,
            instanceHealth,
            trend,
            lastCalculated: new Date(),
        };
    }

    /**
     * KPI 1: Deployment Success Rate
     * Formula: (Successful deploys / Total deploy attempts) × 100%
     */
    private static calculateDeploymentSuccessRate(rapp: Rapp): KPIMetric {
        const history = StateCache.getRappHistory(rapp.rappId);

        if (!history || history.totalDeployAttempts === 0) {
            return {
                value: 100,
                label: 'No History',
                status: 'good',
                color: '#10b981',
                description: 'No deployment attempts recorded',
            };
        }

        const rate = (history.successfulDeploys / history.totalDeployAttempts) * 100;
        const status = rate >= 90 ? 'good' : rate >= 70 ? 'warning' : 'critical';
        const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

        return {
            value: Math.round(rate),
            label: `${history.successfulDeploys}/${history.totalDeployAttempts}`,
            status,
            color,
            description: `${history.successfulDeploys} successful out of ${history.totalDeployAttempts} attempts`,
        };
    }

    /**
     * KPI 2: Resource Utilization
     * Formula: (Active instances / Max instances) × 100%
     */
    private static calculateResourceUtilization(rapp: Rapp): KPIMetric {
        const instances = Object.values(rapp.rappInstances || {});
        const activeInstances = instances.filter(i => i.state === 'DEPLOYED').length;
        const totalInstances = instances.length;

        if (totalInstances === 0) {
            return {
                value: 0,
                label: '0/0',
                status: 'good',
                color: '#10b981',
                description: 'No instances deployed',
            };
        }

        const utilization = (activeInstances / totalInstances) * 100;
        const status = utilization < 80 ? 'good' : utilization < 95 ? 'warning' : 'critical';
        const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

        return {
            value: Math.round(utilization),
            label: `${activeInstances}/${totalInstances}`,
            status,
            color,
            description: `${activeInstances} active instances out of ${totalInstances} total`,
        };
    }

    /**
     * KPI 3: Availability Score
     * Formula: (Time in DEPLOYED / Total observed time) × 100%
     */
    private static calculateAvailabilityScore(rapp: Rapp): KPIMetric {
        const totalTime = StateCache.getTotalObservedTime(rapp.rappId);

        if (totalTime === 0) {
            return {
                value: 100,
                label: 'New',
                status: 'good',
                color: '#10b981',
                description: 'Newly observed rApp',
            };
        }

        const deployedTime = StateCache.getTimeInState(rapp.rappId, 'DEPLOYED');
        const availability = (deployedTime / totalTime) * 100;

        const status = availability >= 99 ? 'good' : availability >= 95 ? 'warning' : 'critical';
        const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

        const hours = Math.floor(deployedTime / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        return {
            value: Math.round(availability),
            label: days > 0 ? `${days}d` : `${hours}h`,
            status,
            color,
            description: `Available ${availability.toFixed(1)}% of observed time`,
        };
    }

    /**
     * KPI 4: Governance Compliance
     * Formula: (Met requirements / Total requirements) × 100%
     */
    private static calculateGovernanceCompliance(rapp: Rapp): KPIMetric {
        const checks = [];

        // Check 1: Has package
        checks.push(!!rapp.packageName && !!rapp.packageLocation);

        // Check 2: Has resources
        checks.push(
            !!rapp.rappResources?.acm ||
            !!rapp.rappResources?.sme ||
            !!rapp.rappResources?.dme
        );

        // Check 3: Has metadata
        checks.push(!!rapp.name);

        // Check 4: Valid state
        checks.push(['COMMISSIONED', 'PRIMING', 'PRIMED', 'DEPRIMING'].includes(rapp.state));

        // Check 5: No orphaned instances
        const instances = Object.values(rapp.rappInstances || {});
        const hasOrphanedInstances = instances.some(i =>
            i.state === 'DEPLOYED' && rapp.state === 'COMMISSIONED'
        );
        checks.push(!hasOrphanedInstances);

        const metRequirements = checks.filter(Boolean).length;
        const totalRequirements = checks.length;
        const compliance = (metRequirements / totalRequirements) * 100;

        const status = compliance === 100 ? 'good' : compliance >= 80 ? 'warning' : 'critical';
        const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

        return {
            value: Math.round(compliance),
            label: `${metRequirements}/${totalRequirements}`,
            status,
            color,
            description: `Meets ${metRequirements} of ${totalRequirements} governance requirements`,
        };
    }

    /**
     * KPI 5: Instance Health
     * Formula: Average instance health score
     */
    private static calculateInstanceHealth(rapp: Rapp): KPIMetric {
        const instances = Object.values(rapp.rappInstances || {});

        if (instances.length === 0) {
            return {
                value: 100,
                label: 'N/A',
                status: 'good',
                color: '#10b981',
                description: 'No instances to monitor',
            };
        }

        const healthScores = instances.map(instance => {
            switch (instance.state) {
                case 'DEPLOYED': return 100;
                case 'DEPLOYING': return 50;
                case 'UNDEPLOYING': return 25;
                case 'UNDEPLOYED': return 0;
                default: return 0;
            }
        });

        const avgHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
        const status = avgHealth >= 80 ? 'good' : avgHealth >= 50 ? 'warning' : 'critical';
        const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

        const healthyCount = instances.filter(i => i.state === 'DEPLOYED').length;

        return {
            value: Math.round(avgHealth),
            label: `${healthyCount}/${instances.length}`,
            status,
            color,
            description: `${healthyCount} healthy instances out of ${instances.length} total`,
        };
    }

    /**
     * Determine overall trend
     */
    private static determineTrend(rapp: Rapp): 'improving' | 'stable' | 'declining' {
        const history = StateCache.getRappHistory(rapp.rappId);

        if (!history || history.deploymentHistory.length < 3) {
            return 'stable';
        }

        // Look at last 5 deployments
        const recentDeployments = history.deploymentHistory.slice(-5);
        const successCount = recentDeployments.filter(d => d.success).length;

        // Compare with overall success rate
        const overallRate = history.successfulDeploys / history.totalDeployAttempts;
        const recentRate = successCount / recentDeployments.length;

        if (recentRate > overallRate + 0.1) return 'improving';
        if (recentRate < overallRate - 0.1) return 'declining';
        return 'stable';
    }

    /**
     * Get trend icon
     */
    static getTrendIcon(trend: 'improving' | 'stable' | 'declining'): string {
        const icons = {
            improving: '↑',
            stable: '→',
            declining: '↓',
        };
        return icons[trend];
    }

    /**
     * Get trend color
     */
    static getTrendColor(trend: 'improving' | 'stable' | 'declining'): string {
        const colors = {
            improving: '#10b981',
            stable: '#6b7280',
            declining: '#ef4444',
        };
        return colors[trend];
    }
}
