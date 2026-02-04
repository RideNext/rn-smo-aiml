import {
    Rapp,
    EnhancedRapp,
    UILifecycleState,
    LifecycleAction,
} from '../types';
import { StateCache } from './StateCache';
import { CertificationAdapter } from './CertificationAdapter';
import { KPICalculator } from './KPICalculator';
import { GovernanceEngine } from './GovernanceEngine';

/**
 * RappAdapter - Main orchestrator that transforms backend Rapp into EnhancedRapp
 * 
 * Coordinates all adapter components to derive:
 * - UI lifecycle state
 * - Certification status
 * - Impact KPIs
 * - Governance validation
 * - Available actions
 */
export class RappAdapter {
    private governanceEngine: GovernanceEngine;

    constructor() {
        this.governanceEngine = new GovernanceEngine();
    }

    /**
     * Transform a backend Rapp into an EnhancedRapp with all derived data
     */
    enhanceRapp(rapp: Rapp): EnhancedRapp {
        // Initialize in cache if first time seeing this rApp
        StateCache.initializeRapp(rapp.rappId);

        // Derive UI lifecycle state
        const uiLifecycleState = this.deriveUILifecycleState(rapp);

        // Calculate certification
        const certification = CertificationAdapter.calculateCertification(rapp);

        // Calculate KPIs
        const impactKPIs = KPICalculator.calculateKPIs(rapp);

        // Validate governance
        const governanceValidation = this.governanceEngine.validateCompliance(rapp);

        // Get available actions
        const availableActions = this.governanceEngine.getAvailableActions(rapp);

        return {
            ...rapp,
            uiLifecycleState,
            certification,
            impactKPIs,
            governanceValidation,
            availableActions,
        };
    }

    /**
     * Derive UI lifecycle state from backend state + instance conditions
     */
    private deriveUILifecycleState(rapp: Rapp): UILifecycleState {
        const instances = Object.values(rapp.rappInstances || {});
        const deployedCount = instances.filter(i => i.state === 'DEPLOYED').length;
        const deployingCount = instances.filter(i => i.state === 'DEPLOYING').length;
        const undeployingCount = instances.filter(i => i.state === 'UNDEPLOYING').length;
        const totalInstances = instances.length;

        // Transitional states (animated)
        if (rapp.state === 'PRIMING') {
            return {
                state: 'preparing',
                label: 'Preparing',
                badgeColor: '#8b5cf6',
                badgeClass: 'badge-purple',
                animated: true,
                description: 'Preparing resources and compositions',
                icon: '⚙️',
            };
        }

        if (rapp.state === 'DEPRIMING') {
            return {
                state: 'decommissioning',
                label: 'Decommissioning',
                badgeColor: '#6b7280',
                badgeClass: 'badge-gray',
                animated: true,
                description: 'Releasing resources',
                icon: '🔄',
            };
        }

        if (deployingCount > 0) {
            return {
                state: 'deploying',
                label: 'Deploying',
                badgeColor: '#3b82f6',
                badgeClass: 'badge-info',
                animated: true,
                description: `Deploying ${deployingCount} instance(s)`,
                icon: '🚀',
            };
        }

        if (undeployingCount > 0) {
            return {
                state: 'scaling-down',
                label: 'Scaling Down',
                badgeColor: '#f59e0b',
                badgeClass: 'badge-warning',
                animated: true,
                description: `Undeploying ${undeployingCount} instance(s)`,
                icon: '⬇️',
            };
        }

        // Stable states
        if (deployedCount === totalInstances && totalInstances > 0) {
            return {
                state: 'deployed',
                label: 'Fully Deployed',
                badgeColor: '#10b981',
                badgeClass: 'badge-success',
                animated: false,
                description: `All ${totalInstances} instance(s) deployed`,
                icon: '✅',
            };
        }

        if (deployedCount > 0 && deployedCount < totalInstances) {
            return {
                state: 'partial',
                label: 'Partially Deployed',
                badgeColor: '#f59e0b',
                badgeClass: 'badge-warning',
                animated: false,
                description: `${deployedCount}/${totalInstances} instances deployed`,
                icon: '⚠️',
            };
        }

        if (rapp.state === 'PRIMED') {
            return {
                state: 'ready',
                label: 'Ready to Deploy',
                badgeColor: '#10b981',
                badgeClass: 'badge-success',
                animated: false,
                description: 'Primed and ready for deployment',
                icon: '✓',
            };
        }

        if (rapp.state === 'COMMISSIONED') {
            // Check for issues (failed instances)
            const history = StateCache.getRappHistory(rapp.rappId);
            const hasFailures = history && history.failedDeploys > 0;

            if (hasFailures) {
                return {
                    state: 'issues',
                    label: 'Available (Issues)',
                    badgeColor: '#f59e0b',
                    badgeClass: 'badge-warning',
                    animated: false,
                    description: 'Package available but has deployment issues',
                    icon: '⚠️',
                };
            }

            return {
                state: 'available',
                label: 'Available',
                badgeColor: '#3b82f6',
                badgeClass: 'badge-info',
                animated: false,
                description: 'Package onboarded and available',
                icon: 'ℹ️',
            };
        }

        // Fallback
        return {
            state: 'available',
            label: rapp.state,
            badgeColor: '#6b7280',
            badgeClass: 'badge-secondary',
            animated: false,
            description: `Current state: ${rapp.state}`,
        };
    }

    /**
     * Track state change (call this when state changes)
     */
    trackStateChange(rappId: string, fromState: string, toState: string, reason?: string): void {
        StateCache.trackStateTransition(rappId, fromState, toState, reason);
    }

    /**
     * Track deployment attempt (call this after deploy/undeploy)
     */
    trackDeployment(
        rappId: string,
        instanceId: string,
        success: boolean,
        duration?: number,
        error?: string
    ): void {
        StateCache.trackDeploymentAttempt(rappId, instanceId, success, duration, error);
    }

    /**
     * Get blocked reason for an action
     */
    getBlockedReason(rapp: Rapp, action: LifecycleAction): string | null {
        return this.governanceEngine.getBlockedReason(rapp, action);
    }

    /**
     * Cleanup old cache data
     */
    static cleanupCache(): void {
        StateCache.cleanup();
    }

    /**
     * Get cache statistics
     */
    static getCacheStats() {
        return StateCache.getStats();
    }
}
