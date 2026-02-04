import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for localStorage persistence
 * Automatically saves and restores state from localStorage
 */
export const useLocalStorage = (key, initialValue) => {
    // Get from local storage then parse stored json or return initialValue
    const readValue = () => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState(readValue);

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function so we have same API as useState
            setStoredValue(oldValue => {
                const valueToStore = value instanceof Function ? value(oldValue) : value;

                // Save to local storage
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    return [storedValue, setValue];
};

/**
 * Hook to track historical cell data in localStorage
 */
export const useCellHistory = (maxEntries = 100) => {
    const [history, setHistory] = useLocalStorage('cell-history', {});

    const addEntry = useCallback((cellId, data) => {
        setHistory(prev => {
            const cellHistory = prev[cellId] || [];
            const newEntry = {
                timestamp: data.timestamp || new Date().toISOString(),
                utilization: data.utilization,
                action: data.action
            };

            const updatedHistory = [...cellHistory, newEntry];

            // Keep only last N entries
            if (updatedHistory.length > maxEntries) {
                updatedHistory.shift();
            }

            return {
                ...prev,
                [cellId]: updatedHistory
            };
        });
    }, [setHistory, maxEntries]);

    const clearHistory = useCallback((cellId) => {
        if (cellId) {
            setHistory(prev => {
                const updated = { ...prev };
                delete updated[cellId];
                return updated;
            });
        } else {
            setHistory({});
        }
    }, [setHistory]);

    const exportData = useCallback(() => {
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cell-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [history]);

    return {
        history,
        addEntry,
        clearHistory,
        exportData
    };
};

/**
 * Hook to manage demo scenarios
 */
export const useDemoScenario = () => {
    const [scenario, setScenario] = useLocalStorage('demo-scenario', 'baseline');
    const [scenarioHistory, setScenarioHistory] = useLocalStorage('scenario-history', []);

    const switchScenario = (newScenario) => {
        const timestamp = new Date().toISOString();
        setScenario(newScenario);
        setScenarioHistory(prev => [
            ...prev,
            { scenario: newScenario, timestamp }
        ].slice(-20)); // Keep last 20 scenario changes
    };

    return {
        scenario,
        scenarioHistory,
        switchScenario
    };
};

/**
 * Hook for session recovery
 */
export const useSessionRecovery = () => {
    const [lastSession, setLastSession] = useLocalStorage('last-session', null);

    const saveSession = (data) => {
        setLastSession({
            timestamp: new Date().toISOString(),
            data
        });
    };

    const clearSession = () => {
        setLastSession(null);
    };

    const hasSession = lastSession !== null;
    const isSessionRecent = () => {
        if (!lastSession) return false;
        const sessionTime = new Date(lastSession.timestamp);
        const now = new Date();
        const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
        return hoursDiff < 24; // Session valid for 24 hours
    };

    return {
        lastSession,
        hasSession: hasSession && isSessionRecent(),
        saveSession,
        clearSession
    };
};
