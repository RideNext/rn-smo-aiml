import {
    Rapp,
    LifecycleAction,
    GovernanceValidation,
    GovernanceViolation,
    GovernanceRules,
    DEFAULT_GOVERNANCE_RULES,
} from '../types';

/**
 * GovernanceEngine - UI-side governance rules and validation
 * 
 * Enforces:
 * - State transition rules
 * - Action prerequisites
 * - Resource quotas
 * - Compliance checks
 */
export class GovernanceEngine {
    private rules: GovernanceRules;

    constructor(rules: GovernanceRules = DEFAULT_GOVERNANCE_RULES) {
        this.rules = rules;
    }

    /**
     * Validate governance compliance for a rApp
     */
    validateCompliance(rapp: Rapp): GovernanceValidation {
        const violations: GovernanceViolation[] = [];
        const warnings: string[] = [];

        // Check 1: Instance count limits
        const instances = Object.values(rapp.rappInstances || {});
        if (instances.length > this.rules.maxInstancesPerRapp) {
            violations.push({
                rule: 'Max Instances Per rApp',
                severity: 'error',
                message: `Exceeds maximum of ${this.rules.maxInstancesPerRapp} instances`,
            });
        }

        // Check 2: State consistency
        const deployedInstances = instances.filter(i => i.state === 'DEPLOYED');
        if (deployedInstances.length > 0 && rapp.state === 'COMMISSIONED') {
            violations.push({
                rule: 'State Consistency',
                severity: 'warning',
                message: 'Has deployed instances but rApp is in COMMISSIONED state',
            });
        }

        // Check 3: Package requirements
        if (!rapp.packageName || !rapp.packageLocation) {
            violations.push({
                rule: 'Package Requirements',
                severity: 'warning',
                message: 'Missing package name or location',
            });
        }

        // Check 4: Resource definitions
        if (!rapp.rappResources?.acm && !rapp.rappResources?.sme && !rapp.rappResources?.dme) {
            violations.push({
                rule: 'Resource Definitions',
                severity: 'warning',
                message: 'No resources defined (ACM/SME/DME)',
            });
        }

        // Calculate compliance score
        const totalChecks = 4;
        const passedChecks = totalChecks - violations.filter(v => v.severity === 'error').length;
        const score = Math.round((passedChecks / totalChecks) * 100);

        return {
            isCompliant: violations.filter(v => v.severity === 'error').length === 0,
            score,
            violations,
            warnings: violations.filter(v => v.severity === 'warning').map(v => v.message),
            lastChecked: new Date(),
        };
    }

    /**
     * Validate if an action is allowed for a rApp
     */
    validateAction(rapp: Rapp, action: LifecycleAction): GovernanceValidation {
        const violations: GovernanceViolation[] = [];
        const warnings: string[] = [];

        switch (action) {
            case 'deploy':
                this.validateDeployAction(rapp, violations);
                break;
            case 'start':
            case 'stop':
            case 'restart':
                this.validateInstanceAction(rapp, violations);
                break;
            case 'upgrade':
            case 'rollback':
                this.validateUpgradeAction(rapp, violations);
                break;
            case 'uninstall':
                this.validateUninstallAction(rapp, violations);
                break;
        }

        return {
            isCompliant: violations.length === 0,
            score: violations.length === 0 ? 100 : 0,
            violations,
            warnings,
            lastChecked: new Date(),
        };
    }

    /**
     * Validate deploy action
     */
    private validateDeployAction(rapp: Rapp, violations: GovernanceViolation[]): void {
        // Must be in PRIMED state
        if (!this.rules.allowedStatesForDeploy.includes(rapp.state)) {
            violations.push({
                rule: 'Deploy Prerequisites',
                severity: 'error',
                message: `Cannot deploy: rApp must be in ${this.rules.allowedStatesForDeploy.join(' or ')} state (current: ${rapp.state})`,
                actionBlocked: 'deploy',
            });
        }

        // Check instance limit
        const instances = Object.values(rapp.rappInstances || {});
        if (instances.length >= this.rules.maxInstancesPerRapp) {
            violations.push({
                rule: 'Instance Limit',
                severity: 'error',
                message: `Cannot deploy: Maximum ${this.rules.maxInstancesPerRapp} instances reached`,
                actionBlocked: 'deploy',
            });
        }

        // Check for instances in transitional states
        const transitioning = instances.some(i =>
            i.state === 'DEPLOYING' || i.state === 'UNDEPLOYING'
        );
        if (transitioning) {
            violations.push({
                rule: 'Concurrent Operations',
                severity: 'error',
                message: 'Cannot deploy: Another instance operation is in progress',
                actionBlocked: 'deploy',
            });
        }
    }

    /**
     * Validate instance lifecycle actions (start/stop/restart)
     */
    private validateInstanceAction(rapp: Rapp, violations: GovernanceViolation[]): void {
        const instances = Object.values(rapp.rappInstances || {});

        if (instances.length === 0) {
            violations.push({
                rule: 'Instance Existence',
                severity: 'error',
                message: 'No instances available for this action',
            });
        }
    }

    /**
     * Validate upgrade/rollback actions
     */
    private validateUpgradeAction(rapp: Rapp, violations: GovernanceViolation[]): void {
        // Must have at least one deployed instance
        const instances = Object.values(rapp.rappInstances || {});
        const deployed = instances.filter(i => i.state === 'DEPLOYED');

        if (deployed.length === 0) {
            violations.push({
                rule: 'Upgrade Prerequisites',
                severity: 'error',
                message: 'No deployed instances to upgrade',
            });
        }
    }

    /**
     * Validate uninstall action
     */
    private validateUninstallAction(rapp: Rapp, violations: GovernanceViolation[]): void {
        // Cannot delete if has deployed instances
        const instances = Object.values(rapp.rappInstances || {});
        const deployed = instances.filter(i => i.state === 'DEPLOYED');

        if (deployed.length > 0) {
            violations.push({
                rule: 'Uninstall Prerequisites',
                severity: 'error',
                message: `Cannot uninstall: ${deployed.length} instance(s) still deployed. Undeploy all instances first.`,
                actionBlocked: 'uninstall',
            });
        }

        // Must be in allowed state
        if (!this.rules.allowedStatesForDelete.includes(rapp.state)) {
            violations.push({
                rule: 'State Requirements',
                severity: 'error',
                message: `Cannot uninstall: rApp must be in ${this.rules.allowedStatesForDelete.join(' or ')} state (current: ${rapp.state})`,
                actionBlocked: 'uninstall',
            });
        }
    }

    /**
     * Get available actions for a rApp based on current state
     */
    getAvailableActions(rapp: Rapp): LifecycleAction[] {
        const actions: LifecycleAction[] = [];
        const instances = Object.values(rapp.rappInstances || {});
        const deployed = instances.filter(i => i.state === 'DEPLOYED');

        // Deploy: Only if PRIMED and under instance limit
        if (
            this.rules.allowedStatesForDeploy.includes(rapp.state) &&
            instances.length < this.rules.maxInstancesPerRapp
        ) {
            actions.push('deploy');
        }

        // Start/Stop/Restart: If has instances
        if (instances.length > 0) {
            actions.push('start', 'stop', 'restart');
        }

        // Upgrade/Rollback: If has deployed instances
        if (deployed.length > 0) {
            actions.push('upgrade', 'rollback');
        }

        // Uninstall: If no deployed instances and in allowed state
        if (
            deployed.length === 0 &&
            this.rules.allowedStatesForDelete.includes(rapp.state)
        ) {
            actions.push('uninstall');
        }

        return actions;
    }

    /**
     * Get reason why an action is blocked
     */
    getBlockedReason(rapp: Rapp, action: LifecycleAction): string | null {
        const validation = this.validateAction(rapp, action);

        if (validation.isCompliant) {
            return null;
        }

        const blockedViolation = validation.violations.find(v => v.actionBlocked === action);
        return blockedViolation?.message || validation.violations[0]?.message || 'Action not allowed';
    }
}
