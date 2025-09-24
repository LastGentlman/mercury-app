/**
 * React Hook for Optimized Schema Management
 * 
 * Provides a clean API for schema operations including:
 * - Batch table information fetching
 * - Foreign key relationship queries
 * - Performance monitoring
 * - Cache management
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSchemaManager, type SchemaInfo, type ForeignKeyInfo } from '../utils/schema-manager.ts';

export interface UseOptimizedSchemaReturn {
  // Data fetching functions
  getTableInfo: (tableNames: string[]) => Promise<SchemaInfo[]>;
  getForeignKeys: (tableNames?: string[]) => Promise<ForeignKeyInfo[]>;
  getTableDefinition: (tableName: string) => Promise<string>;
  
  // Performance monitoring
  getPerformanceStats: () => Promise<any>;
  
  // Cache management
  cleanupCache: () => Promise<{ localCleaned: number; dbCleaned: number }>;
  
  // Health check
  healthCheck: () => Promise<any>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useOptimizedSchema(): UseOptimizedSchemaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const schemaManager = getSchemaManager();

  const getTableInfo = useCallback(async (tableNames: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await schemaManager.getBatchTableInfo(tableNames);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching table info:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [schemaManager]);

  const getForeignKeys = useCallback(async (tableNames?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await schemaManager.getForeignKeysForTables(tableNames);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching foreign keys:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [schemaManager]);

  const getTableDefinition = useCallback(async (tableName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await schemaManager.getOptimizedTableDefinition(tableName);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching table definition:', err);
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [schemaManager]);

  const getPerformanceStats = useCallback(async () => {
    try {
      return await schemaManager.getPerformanceStats();
    } catch (err) {
      console.error('Error fetching performance stats:', err);
      return {
        connectionStats: [],
        slowQueries: [],
        cacheHitRatio: [],
        cacheInfo: { localCacheSize: 0, localCacheHits: 0, dbCacheEntries: 0 }
      };
    }
  }, [schemaManager]);

  const cleanupCache = useCallback(async () => {
    try {
      return await schemaManager.cleanupCache();
    } catch (err) {
      console.error('Error cleaning cache:', err);
      return { localCleaned: 0, dbCleaned: 0 };
    }
  }, [schemaManager]);

  const healthCheck = useCallback(async () => {
    try {
      return await schemaManager.healthCheck();
    } catch (err) {
      console.error('Error performing health check:', err);
      return { status: 'unhealthy', details: { localCache: false, dbCache: false, connectionPool: false } };
    }
  }, [schemaManager]);

  return {
    getTableInfo,
    getForeignKeys,
    getTableDefinition,
    getPerformanceStats,
    cleanupCache,
    healthCheck,
    isLoading,
    error,
  };
}

/**
 * Hook for pre-loading schema data with React Query
 * Useful for components that need schema information immediately
 */
export function useSchemaData(tableNames: string[]) {
  return useQuery({
    queryKey: ['schema-data', tableNames],
    queryFn: () => {
      const schemaManager = getSchemaManager();
      return schemaManager.getBatchTableInfo(tableNames);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for foreign key relationships with React Query
 */
export function useForeignKeyData(tableNames?: string[]) {
  return useQuery({
    queryKey: ['foreign-keys', tableNames],
    queryFn: () => {
      const schemaManager = getSchemaManager();
      return schemaManager.getForeignKeysForTables(tableNames);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (FK relationships change less frequently)
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for performance monitoring
 */
export function useSchemaPerformance() {
  return useQuery({
    queryKey: ['schema-performance'],
    queryFn: () => {
      const schemaManager = getSchemaManager();
      return schemaManager.getPerformanceStats();
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for schema health monitoring
 */
export function useSchemaHealth() {
  return useQuery({
    queryKey: ['schema-health'],
    queryFn: () => {
      const schemaManager = getSchemaManager();
      return schemaManager.healthCheck();
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: false,
  });
}
