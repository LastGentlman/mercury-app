/**
 * Schema Manager Usage Example Component
 * 
 * Demonstrates how to use the OptimizedSchemaManager with React hooks
 * for efficient schema data fetching and caching.
 */

import React, { useState } from 'react';
import { useOptimizedSchema, useSchemaData, useForeignKeyData, useSchemaPerformance, useSchemaHealth } from '../hooks/useOptimizedSchema.ts';

export function SchemaManagerExample() {
  const [selectedTables, setSelectedTables] = useState<string[]>(['users', 'businesses', 'orders']);
  const [tableDefinition, setTableDefinition] = useState<string>('');
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  // Using the main hook for manual operations
  const {
    getTableInfo,
    getForeignKeys,
    getTableDefinition,
    getPerformanceStats,
    cleanupCache,
    healthCheck,
    isLoading,
    error
  } = useOptimizedSchema();

  // Using React Query hooks for automatic caching and refetching
  const { data: schemaData, isLoading: isSchemaLoading } = useSchemaData(selectedTables);
  const { data: foreignKeyData, isLoading: isForeignKeyLoading } = useForeignKeyData(selectedTables);
  const { data: performanceStats, isLoading: isPerformanceLoading } = useSchemaPerformance();
  const { data: healthData, isLoading: isHealthLoading } = useSchemaHealth();

  const handleGetTableDefinition = async (tableName: string) => {
    setIsLoadingDefinition(true);
    try {
      const definition = await getTableDefinition(tableName);
      setTableDefinition(definition);
    } catch (err) {
      console.error('Error getting table definition:', err);
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  const handleCleanupCache = async () => {
    try {
      const result = await cleanupCache();
      alert(`Cache cleaned: ${result.localCleaned} local entries, ${result.dbCleaned} DB entries`);
    } catch (err) {
      console.error('Error cleaning cache:', err);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await healthCheck();
      alert(`Health Status: ${health.status}\nDetails: ${JSON.stringify(health.details, null, 2)}`);
    } catch (err) {
      console.error('Error checking health:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Schema Manager Example</h1>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Table Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Select Tables to Query</h2>
        <div className="flex flex-wrap gap-2">
          {['users', 'businesses', 'orders', 'products', 'employees', 'profiles', 'branches'].map(table => (
            <label key={table} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTables.includes(table)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTables([...selectedTables, table]);
                  } else {
                    setSelectedTables(selectedTables.filter(t => t !== table));
                  }
                }}
                className="mr-2"
              />
              {table}
            </label>
          ))}
        </div>
      </div>

      {/* Schema Data Display */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Schema Information</h2>
        {isSchemaLoading ? (
          <div className="text-gray-500">Loading schema data...</div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-64">
              {JSON.stringify(schemaData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Foreign Key Data Display */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Foreign Key Relationships</h2>
        {isForeignKeyLoading ? (
          <div className="text-gray-500">Loading foreign key data...</div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-64">
              {JSON.stringify(foreignKeyData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Table Definition */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Table Definition</h2>
        <div className="flex gap-2 mb-3">
          <select
            onChange={(e) => handleGetTableDefinition(e.target.value)}
            className="px-3 py-2 border rounded"
            disabled={isLoadingDefinition}
          >
            <option value="">Select a table...</option>
            {selectedTables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
        </div>
        {isLoadingDefinition ? (
          <div className="text-gray-500">Loading table definition...</div>
        ) : tableDefinition ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-64">
              {tableDefinition}
            </pre>
          </div>
        ) : (
          <div className="text-gray-500">Select a table to view its definition</div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Performance Statistics</h2>
        {isPerformanceLoading ? (
          <div className="text-gray-500">Loading performance stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Local Cache</h3>
              <p className="text-2xl font-bold text-blue-600">
                {performanceStats?.cacheInfo?.localCacheSize || 0}
              </p>
              <p className="text-sm text-blue-600">entries</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Cache Hits</h3>
              <p className="text-2xl font-bold text-green-600">
                {performanceStats?.cacheInfo?.localCacheHits || 0}
              </p>
              <p className="text-sm text-green-600">total hits</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">DB Cache</h3>
              <p className="text-2xl font-bold text-purple-600">
                {performanceStats?.cacheInfo?.dbCacheEntries || 0}
              </p>
              <p className="text-sm text-purple-600">entries</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">Database Size</h3>
              <p className="text-2xl font-bold text-orange-600">
                {performanceStats?.performanceSummary?.database_size_mb || 0}
              </p>
              <p className="text-sm text-orange-600">MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">System Health</h2>
        {isHealthLoading ? (
          <div className="text-gray-500">Checking health...</div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              healthData?.status === 'healthy' ? 'bg-green-100 text-green-800' :
              healthData?.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Status: {healthData?.status?.toUpperCase() || 'UNKNOWN'}
            </div>
            <div className="text-sm text-gray-600">
              Local Cache: {healthData?.details?.localCache ? '✅' : '❌'} | 
              DB Cache: {healthData?.details?.dbCache ? '✅' : '❌'} | 
              Performance Summary: {healthData?.details?.performanceSummary ? '✅' : '❌'}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleCleanupCache}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Clean Cache
        </button>
        <button
          onClick={handleHealthCheck}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Health Check
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Refresh Page
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Loading...
        </div>
      )}
    </div>
  );
}
