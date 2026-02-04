import {
    RappHistoricalData,
    StateCacheData,
    DeploymentRecord,
    StateTransition,
} from '../types';

/**
 * StateCache - Client-side historical data tracking for KPI calculations
 * 
 * Stores deployment history and state transitions in localStorage to enable
 * KPI calculations without backend modifications.
 */
export class StateCache {
    private static readonly STORAGE_KEY = 'rapp-manager-state-cache';
    private static readonly VERSION = '1.0';
    private static readonly MAX_HISTORY_DAYS = 30;

    /**
     * Get all cached data
     */
    private static getData(): StateCacheData {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return this.createEmptyCache();
            }

            const data: StateCacheData = JSON.parse(stored, (key, value) => {
                // Revive Date objects
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                    return new Date(value);
                }
                return value;
            });

            // Validate version
            if (data.version !== this.VERSION) {
                console.warn('StateCache version mismatch, resetting cache');
                return this.createEmptyCache();
            }

            return data;
        } catch (error) {
            console.error('Error reading StateCache:', error);
            return this.createEmptyCache();
        }
    }

    /**
     * Save data to localStorage
     */
    private static setData(data: StateCacheData): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error writing StateCache:', error);
        }
    }

    /**
     * Create empty cache structure
     */
    private static createEmptyCache(): StateCacheData {
        return {
            version: this.VERSION,
            rapps: {},
            lastCleanup: new Date(),
        };
    }

    /**
     * Get historical data for a specific rApp
     */
    static getRappHistory(rappId: string): RappHistoricalData | null {
        const data = this.getData();
        return data.rapps[rappId] || null;
    }

    /**
     * Track a state transition
     */
    static trackStateTransition(
        rappId: string,
        fromState: string,
        toState: string,
        reason?: string
    ): void {
        const data = this.getData();

        if (!data.rapps[rappId]) {
            data.rapps[rappId] = this.createEmptyRappHistory(rappId);
        }

        const transition: StateTransition = {
            timestamp: new Date(),
            fromState,
            toState,
            reason,
        };

        data.rapps[rappId].stateTransitions.push(transition);
        data.rapps[rappId].lastUpdated = new Date();

        this.setData(data);
    }

    /**
     * Track a deployment attempt
     */
    static trackDeploymentAttempt(
        rappId: string,
        instanceId: string,
        success: boolean,
        duration?: number,
        error?: string
    ): void {
        const data = this.getData();

        if (!data.rapps[rappId]) {
            data.rapps[rappId] = this.createEmptyRappHistory(rappId);
        }

        const record: DeploymentRecord = {
            timestamp: new Date(),
            instanceId,
            success,
            duration,
            error,
        };

        data.rapps[rappId].deploymentHistory.push(record);
        data.rapps[rappId].totalDeployAttempts++;

        if (success) {
            data.rapps[rappId].successfulDeploys++;
        } else {
            data.rapps[rappId].failedDeploys++;
        }

        data.rapps[rappId].lastUpdated = new Date();

        this.setData(data);
    }

    /**
     * Get deployment history for a rApp
     */
    static getDeploymentHistory(rappId: string): DeploymentRecord[] {
        const history = this.getRappHistory(rappId);
        return history?.deploymentHistory || [];
    }

    /**
     * Get state transition history for a rApp
     */
    static getStateHistory(rappId: string): StateTransition[] {
        const history = this.getRappHistory(rappId);
        return history?.stateTransitions || [];
    }

    /**
     * Get deployment success rate
     */
    static getDeploymentSuccessRate(rappId: string): number {
        const history = this.getRappHistory(rappId);
        if (!history || history.totalDeployAttempts === 0) {
            return 100; // No history = assume good
        }

        return (history.successfulDeploys / history.totalDeployAttempts) * 100;
    }

    /**
     * Calculate time spent in a specific state
     */
    static getTimeInState(rappId: string, state: string): number {
        const transitions = this.getStateHistory(rappId);
        if (transitions.length === 0) return 0;

        let totalTime = 0;
        let currentState = transitions[0].toState;
        let stateStartTime = transitions[0].timestamp.getTime();

        for (let i = 1; i < transitions.length; i++) {
            const transition = transitions[i];
            const duration = transition.timestamp.getTime() - stateStartTime;

            if (currentState === state) {
                totalTime += duration;
            }

            currentState = transition.toState;
            stateStartTime = transition.timestamp.getTime();
        }

        // Add time from last transition to now if in target state
        if (currentState === state) {
            totalTime += Date.now() - stateStartTime;
        }

        return totalTime;
    }

    /**
     * Get total observed time for a rApp
     */
    static getTotalObservedTime(rappId: string): number {
        const history = this.getRappHistory(rappId);
        if (!history) return 0;

        return Date.now() - history.firstObserved.getTime();
    }

    /**
     * Clean up old data
     */
    static cleanup(): void {
        const data = this.getData();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.MAX_HISTORY_DAYS);

        Object.keys(data.rapps).forEach(rappId => {
            const rappData = data.rapps[rappId];

            // Remove old deployment records
            rappData.deploymentHistory = rappData.deploymentHistory.filter(
                record => record.timestamp >= cutoffDate
            );

            // Remove old state transitions
            rappData.stateTransitions = rappData.stateTransitions.filter(
                transition => transition.timestamp >= cutoffDate
            );

            // Recalculate counters
            rappData.totalDeployAttempts = rappData.deploymentHistory.length;
            rappData.successfulDeploys = rappData.deploymentHistory.filter(r => r.success).length;
            rappData.failedDeploys = rappData.deploymentHistory.filter(r => !r.success).length;

            // Remove rApp if no data left
            if (rappData.deploymentHistory.length === 0 && rappData.stateTransitions.length === 0) {
                delete data.rapps[rappId];
            }
        });

        data.lastCleanup = new Date();
        this.setData(data);
    }

    /**
     * Clear all data
     */
    static clear(rappId?: string): void {
        if (rappId) {
            const data = this.getData();
            delete data.rapps[rappId];
            this.setData(data);
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Create empty rApp history
     */
    private static createEmptyRappHistory(rappId: string): RappHistoricalData {
        return {
            rappId,
            deploymentHistory: [],
            stateTransitions: [],
            firstObserved: new Date(),
            lastUpdated: new Date(),
            totalDeployAttempts: 0,
            successfulDeploys: 0,
            failedDeploys: 0,
        };
    }

    /**
     * Initialize rApp in cache if not exists
     */
    static initializeRapp(rappId: string): void {
        const data = this.getData();
        if (!data.rapps[rappId]) {
            data.rapps[rappId] = this.createEmptyRappHistory(rappId);
            this.setData(data);
        }
    }

    /**
     * Get cache statistics
     */
    static getStats(): {
        totalRapps: number;
        totalDeployments: number;
        totalTransitions: number;
        cacheSize: number;
    } {
        const data = this.getData();
        const rapps = Object.values(data.rapps);

        return {
            totalRapps: rapps.length,
            totalDeployments: rapps.reduce((sum, r) => sum + r.deploymentHistory.length, 0),
            totalTransitions: rapps.reduce((sum, r) => sum + r.stateTransitions.length, 0),
            cacheSize: new Blob([JSON.stringify(data)]).size,
        };
    }
}
