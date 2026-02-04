import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rappApi } from '../api/rappApi';
import { EnhancedRapp, Rapp } from '../types';
import { RappAdapter } from '../adapters';

/**
 * Custom hook that fetches rapps and enhances them with adapter layer
 * 
 * Returns EnhancedRapp[] with:
 * - Derived UI lifecycle states
 * - Certification status
 * - Impact KPIs
 * - Governance validation
 * - Available actions
 */
export const useEnhancedRapps = () => {
    // Fetch rapps from backend
    const { data: rapps, isLoading, error, refetch } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    // Create adapter instance
    const adapter = useMemo(() => new RappAdapter(), []);

    // Transform rapps with adapter
    const enhancedRapps = useMemo<EnhancedRapp[]>(() => {
        if (!rapps) return [];

        return rapps.map(rapp => adapter.enhanceRapp(rapp));
    }, [rapps, adapter]);

    return {
        rapps: enhancedRapps,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Custom hook for a single enhanced rApp
 */
export const useEnhancedRapp = (rappId: string) => {
    const { data: rapp, isLoading, error, refetch } = useQuery<Rapp>({
        queryKey: ['rapps', rappId],
        queryFn: async () => (await rappApi.getRapp(rappId)).data,
    });

    const adapter = useMemo(() => new RappAdapter(), []);

    const enhancedRapp = useMemo<EnhancedRapp | null>(() => {
        if (!rapp) return null;
        return adapter.enhanceRapp(rapp);
    }, [rapp, adapter]);

    return {
        rapp: enhancedRapp,
        isLoading,
        error,
        refetch,
    };
};
