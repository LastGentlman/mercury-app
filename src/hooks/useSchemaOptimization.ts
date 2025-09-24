/**
 * Hook para optimización de consultas de schema
 * 
 * Proporciona métodos optimizados para reemplazar consultas lentas
 * con versiones que usan el Schema Manager
 */

import { useState, useCallback, useEffect } from 'react';
import { getSchemaManager } from '../utils/schema-manager.ts';
import { useOptimizedSchema } from './useOptimizedSchema.ts';

interface SchemaOptimizationOptions {
  fallbackToSlow?: boolean;
  logPerformance?: boolean;
}

export function useSchemaOptimization(options: SchemaOptimizationOptions = {}) {
  const {
    fallbackToSlow = true,
    logPerformance = false
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const schemaManager = getSchemaManager();
  const { getTableInfo, getForeignKeys, getTableDefinition } = useOptimizedSchema();

  // Inicializar el schema manager
  useEffect(() => {
    const initialize = async () => {
      try {
        await schemaManager.warmupCache(['profiles', 'businesses', 'orders', 'products', 'employees']);
        setIsInitialized(true);
        if (logPerformance) {
          console.log('✅ Schema Manager initialized and warmed up');
        }
      } catch (error) {
        console.error('❌ Failed to initialize Schema Manager:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initialize();
  }, [logPerformance]);

  // Función optimizada para información de tablas
  const getOptimizedTableInfo = useCallback(async (tableNames: string[]) => {
    const startTime = logPerformance ? performance.now() : 0;
    
    try {
      const result = await getTableInfo(tableNames);
      
      if (logPerformance) {
        const endTime = performance.now();
        console.log(`⚡ getTableInfo(${tableNames.join(', ')}) took ${(endTime - startTime).toFixed(1)}ms`);
      }
      
      return result;
    } catch (error) {
      if (logPerformance) {
        console.error(`❌ getTableInfo failed:`, error);
      }
      
      if (fallbackToSlow) {
        console.warn('🔄 Falling back to slow method...');
        return await getSlowTableInfo(tableNames);
      }
      
      throw error;
    }
  }, [getTableInfo, fallbackToSlow, logPerformance]);

  // Función optimizada para foreign keys
  const getOptimizedForeignKeys = useCallback(async (tableNames?: string[]) => {
    const startTime = logPerformance ? performance.now() : 0;
    
    try {
      const result = await getForeignKeys(tableNames);
      
      if (logPerformance) {
        const endTime = performance.now();
        console.log(`⚡ getForeignKeys(${tableNames?.join(', ') || 'all'}) took ${(endTime - startTime).toFixed(1)}ms`);
      }
      
      return result;
    } catch (error) {
      if (logPerformance) {
        console.error(`❌ getForeignKeys failed:`, error);
      }
      
      if (fallbackToSlow) {
        console.warn('🔄 Falling back to slow method...');
        return await getSlowForeignKeys(tableNames);
      }
      
      throw error;
    }
  }, [getForeignKeys, fallbackToSlow, logPerformance]);

  // Función optimizada para definiciones de tabla
  const getOptimizedTableDefinition = useCallback(async (tableName: string) => {
    const startTime = logPerformance ? performance.now() : 0;
    
    try {
      const result = await getTableDefinition(tableName);
      
      if (logPerformance) {
        const endTime = performance.now();
        console.log(`⚡ getTableDefinition(${tableName}) took ${(endTime - startTime).toFixed(1)}ms`);
      }
      
      return result;
    } catch (error) {
      if (logPerformance) {
        console.error(`❌ getTableDefinition failed:`, error);
      }
      
      if (fallbackToSlow) {
        console.warn('🔄 Falling back to slow method...');
        return await getSlowTableDefinition(tableName);
      }
      
      throw error;
    }
  }, [getTableDefinition, fallbackToSlow, logPerformance]);

  // Métodos lentos como fallback
  const getSlowTableInfo = useCallback(async (tableNames: string[]) => {
    const { supabase } = await import('../utils/supabase.ts');
    if (!supabase) throw new Error('Supabase client not configured');
    
    const results = [];
    
    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (error) throw error;
      results.push(...data);
    }
    
    return results;
  }, []);

  const getSlowForeignKeys = useCallback(async (tableNames?: string[]) => {
    const { supabase } = await import('../utils/supabase.ts');
    if (!supabase) throw new Error('Supabase client not configured');
    
    let query = supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type,
        key_column_usage!inner(column_name),
        constraint_column_usage!inner(table_name, column_name)
      `)
      .eq('table_schema', 'public')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (tableNames && tableNames.length > 0) {
      query = query.in('table_name', tableNames);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  }, []);

  const getSlowTableDefinition = useCallback(async (tableName: string) => {
    const { supabase } = await import('../utils/supabase.ts');
    if (!supabase) throw new Error('Supabase client not configured');
    
    const { data, error } = await supabase
      .rpc('pg_get_tabledef', { table_name: tableName });
    
    if (error) throw error;
    return data;
  }, []);

  // Función para limpiar caché
  const clearCache = useCallback(async () => {
    try {
      const result = await schemaManager.cleanupCache();
      if (logPerformance) {
        console.log(`🧹 Cache cleared: ${result.localCleaned} local, ${result.dbCleaned} DB entries`);
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }, [schemaManager, logPerformance]);

  // Función para obtener estadísticas de rendimiento
  const getPerformanceStats = useCallback(async () => {
    try {
      return await schemaManager.getPerformanceStats();
    } catch (error) {
      console.error('❌ Failed to get performance stats:', error);
      throw error;
    }
  }, [schemaManager]);

  // Función para verificar salud del sistema
  const getHealthStatus = useCallback(async () => {
    try {
      return await schemaManager.healthCheck();
    } catch (error) {
      console.error('❌ Failed to get health status:', error);
      throw error;
    }
  }, [schemaManager]);

  return {
    // Estado
    isInitialized,
    
    // Métodos optimizados
    getTableInfo: getOptimizedTableInfo,
    getForeignKeys: getOptimizedForeignKeys,
    getTableDefinition: getOptimizedTableDefinition,
    
    // Utilidades
    clearCache,
    getPerformanceStats,
    getHealthStatus,
    
    // Métodos lentos (para comparación)
    getSlowTableInfo,
    getSlowForeignKeys,
    getSlowTableDefinition
  };
}

// Hook especializado para componentes que necesitan información de schema
export function useTableSchema(tableNames: string[], options: SchemaOptimizationOptions = {}) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getTableInfo, isInitialized } = useSchemaOptimization(options);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getTableInfo(tableNames);
      setData(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching table schema:', err);
    } finally {
      setLoading(false);
    }
  }, [tableNames, getTableInfo]);

  useEffect(() => {
    if (!isInitialized || !tableNames.length) return;
    fetchData();
  }, [isInitialized, tableNames.length, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook especializado para foreign keys
export function useTableForeignKeys(tableNames?: string[], options: SchemaOptimizationOptions = {}) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getForeignKeys, isInitialized } = useSchemaOptimization(options);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getForeignKeys(tableNames);
      setData(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching foreign keys:', err);
    } finally {
      setLoading(false);
    }
  }, [tableNames, getForeignKeys]);

  useEffect(() => {
    if (!isInitialized) return;
    fetchData();
  }, [isInitialized, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
