import {
    Rapp,
    RappInstance,
    CertificationStatus,
    CertificationCheck,
} from '../types';
import { StateCache } from './StateCache';

/**
 * CertificationAdapter - Derives certification status from rApp metadata and history
 * 
 * Calculates certification level based on:
 * - Package structure validation
 * - Metadata completeness
 * - Resource definitions
 * - Deployment history
 */
export class CertificationAdapter {
    /**
     * Calculate certification status for a rApp
     */
    static calculateCertification(rapp: Rapp): CertificationStatus {
        const checks = this.runCertificationChecks(rapp);
        const score = this.calculateScore(checks);
        const level = this.determineLevel(score, rapp);

        return {
            level,
            badge: this.getBadge(level),
            score,
            checks,
            lastUpdated: new Date(),
        };
    }

    /**
     * Run all certification checks
     */
    private static runCertificationChecks(rapp: Rapp): CertificationCheck[] {
        return [
            this.checkPackageStructure(rapp),
            this.checkMetadataCompleteness(rapp),
            this.checkResourceDefinitions(rapp),
            this.checkDeploymentHistory(rapp),
            this.checkInstanceStability(rapp),
        ];
    }

    /**
     * Check 1: Package structure validation
     */
    private static checkPackageStructure(rapp: Rapp): CertificationCheck {
        const hasPackage = !!rapp.packageName && !!rapp.packageLocation;

        return {
            name: 'Package Structure',
            description: 'Valid CSAR package with proper structure',
            passed: hasPackage,
            weight: 20,
            details: hasPackage
                ? `Package: ${rapp.packageName}`
                : 'Missing package information',
        };
    }

    /**
     * Check 2: Metadata completeness
     */
    private static checkMetadataCompleteness(rapp: Rapp): CertificationCheck {
        const hasName = !!rapp.name;
        const hasProvider = !!rapp.provider || !!rapp.asdMetadata?.provider;
        const hasVendor = !!rapp.vendor || !!rapp.asdMetadata?.vendor;
        const hasVersion = !!rapp.version || !!rapp.asdMetadata?.version;
        const hasDescription = !!rapp.description || !!rapp.asdMetadata?.description;

        const completeness = [hasName, hasProvider, hasVendor, hasVersion, hasDescription]
            .filter(Boolean).length;
        const passed = completeness >= 4;

        return {
            name: 'Metadata Completeness',
            description: 'Complete rApp metadata (name, provider, vendor, version, description)',
            passed,
            weight: 15,
            details: `${completeness}/5 fields complete`,
        };
    }

    /**
     * Check 3: Resource definitions
     */
    private static checkResourceDefinitions(rapp: Rapp): CertificationCheck {
        const hasACM = !!rapp.rappResources?.acm;
        const hasSME = !!rapp.rappResources?.sme;
        const hasDME = !!rapp.rappResources?.dme;

        const resourceCount = [hasACM, hasSME, hasDME].filter(Boolean).length;
        const passed = resourceCount >= 1;

        const resourceTypes = [];
        if (hasACM) resourceTypes.push('ACM');
        if (hasSME) resourceTypes.push('SME');
        if (hasDME) resourceTypes.push('DME');

        return {
            name: 'Resource Definitions',
            description: 'At least one resource type defined (ACM/SME/DME)',
            passed,
            weight: 25,
            details: passed
                ? `Resources: ${resourceTypes.join(', ')}`
                : 'No resources defined',
        };
    }

    /**
     * Check 4: Deployment history
     */
    private static checkDeploymentHistory(rapp: Rapp): CertificationCheck {
        const history = StateCache.getRappHistory(rapp.rappId);
        const successfulDeploys = history?.successfulDeploys || 0;
        const passed = successfulDeploys >= 1;

        return {
            name: 'Deployment History',
            description: 'At least one successful deployment',
            passed,
            weight: 20,
            details: `${successfulDeploys} successful deployment(s)`,
        };
    }

    /**
     * Check 5: Instance stability
     */
    private static checkInstanceStability(rapp: Rapp): CertificationCheck {
        const history = StateCache.getRappHistory(rapp.rappId);

        if (!history || history.totalDeployAttempts === 0) {
            return {
                name: 'Instance Stability',
                description: 'Low failure rate (<10%)',
                passed: true, // No history = assume stable
                weight: 20,
                details: 'No deployment history',
            };
        }

        const failureRate = (history.failedDeploys / history.totalDeployAttempts) * 100;
        const passed = failureRate < 10;

        return {
            name: 'Instance Stability',
            description: 'Low failure rate (<10%)',
            passed,
            weight: 20,
            details: `${failureRate.toFixed(1)}% failure rate`,
        };
    }

    /**
     * Calculate overall score from checks
     */
    private static calculateScore(checks: CertificationCheck[]): number {
        const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
        const earnedWeight = checks
            .filter(check => check.passed)
            .reduce((sum, check) => sum + check.weight, 0);

        return Math.round((earnedWeight / totalWeight) * 100);
    }

    /**
     * Determine certification level from score and deployment history
     */
    private static determineLevel(
        score: number,
        rapp: Rapp
    ): 'certified' | 'validated' | 'experimental' | 'uncertified' {
        const history = StateCache.getRappHistory(rapp.rappId);
        const successfulDeploys = history?.successfulDeploys || 0;
        const failureRate = history && history.totalDeployAttempts > 0
            ? (history.failedDeploys / history.totalDeployAttempts) * 100
            : 0;

        // O-RAN Certified: High score + proven track record
        if (score >= 90 && successfulDeploys >= 5 && failureRate < 10) {
            return 'certified';
        }

        // Validated: Good score + at least one successful deployment
        if (score >= 70 && successfulDeploys >= 1) {
            return 'validated';
        }

        // Experimental: Passing score but limited history
        if (score >= 50) {
            return 'experimental';
        }

        // Uncertified: Low score
        return 'uncertified';
    }

    /**
     * Get badge emoji for certification level
     */
    private static getBadge(level: CertificationStatus['level']): string {
        const badges = {
            certified: '🏅',
            validated: '✅',
            experimental: '⚠️',
            uncertified: '❌',
        };
        return badges[level];
    }

    /**
     * Get human-readable label for certification level
     */
    static getLabel(level: CertificationStatus['level']): string {
        const labels = {
            certified: 'O-RAN Certified',
            validated: 'Validated',
            experimental: 'Experimental',
            uncertified: 'Uncertified',
        };
        return labels[level];
    }

    /**
     * Get color for certification level
     */
    static getColor(level: CertificationStatus['level']): string {
        const colors = {
            certified: '#10b981', // green
            validated: '#3b82f6', // blue
            experimental: '#f59e0b', // yellow
            uncertified: '#ef4444', // red
        };
        return colors[level];
    }
}
