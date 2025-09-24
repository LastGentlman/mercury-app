/**
 * Schema Optimization Dashboard
 * 
 * Muestra el estado del sistema de optimización y permite
 * gestionar el caché y monitorear el rendimiento
 */

import { useState, useEffect } from 'react';
import { useSchemaOptimization } from '../hooks/useSchemaOptimization.ts';

export function SchemaOptimizationDashboard() {
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    isInitialized,
    clearCache,
    getPerformanceStats,
    getHealthStatus
  } = useSchemaOptimization({ logPerformance: true });

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [stats, health] = await Promise.all([
        getPerformanceStats(),
        getHealthStatus()
      ]);
      
      setPerformanceStats(stats);
      setHealthStatus(health);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      refreshData();
    }
  }, [isInitialized]);

  const handleClearCache = async () => {
    try {
      await clearCache();
      await refreshData();
      alert('Cache cleared successfully!');
    } catch (error) {
      alert('Failed to clear cache: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Schema Optimization System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schema Optimization Dashboard</h1>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">System Health</h2>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(healthStatus.status)}`}>
                {getStatusIcon(healthStatus.status)} {healthStatus.status?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">
                Local Cache: {healthStatus.details?.localCache ? '✅' : '❌'} | 
                DB Cache: {healthStatus.details?.dbCache ? '✅' : '❌'} | 
                Performance: {healthStatus.details?.performanceSummary ? '✅' : '❌'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {performanceStats && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Performance Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-blue-800">Local Cache</h3>
              <p className="text-2xl font-bold text-blue-600">
                {performanceStats.cacheInfo?.localCacheSize || 0}
              </p>
              <p className="text-sm text-blue-600">entries</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-green-800">Cache Hits</h3>
              <p className="text-2xl font-bold text-green-600">
                {performanceStats.cacheInfo?.localCacheHits || 0}
              </p>
              <p className="text-sm text-green-600">total hits</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-purple-800">DB Cache</h3>
              <p className="text-2xl font-bold text-purple-600">
                {performanceStats.cacheInfo?.dbCacheEntries || 0}
              </p>
              <p className="text-sm text-purple-600">entries</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-orange-800">DB Size</h3>
              <p className="text-2xl font-bold text-orange-600">
                {performanceStats.performanceSummary?.database_size_mb || 0}
              </p>
              <p className="text-sm text-orange-600">MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Cache Management */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Cache Management</h2>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex gap-4">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Cache
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh Stats
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Clearing the cache will remove all cached schema data and force fresh queries on next access.
          </p>
        </div>
      </div>

      {/* Performance Summary */}
      {performanceStats?.performanceSummary && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Database Summary</h2>
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800">Total Tables</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {performanceStats.performanceSummary.total_tables || 0}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Active Cache Entries</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {performanceStats.performanceSummary.cache_stats?.active_entries || 0}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Avg Access Count</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {performanceStats.performanceSummary.cache_stats?.avg_access_count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How to Use Optimized Queries</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>In your components:</strong></p>
          <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`import { useSchemaOptimization } from '@/hooks/useSchemaOptimization';

function MyComponent() {
  const { getTableInfo } = useSchemaOptimization();
  
  const handleGetTables = async () => {
    const data = await getTableInfo(['users', 'orders']);
    // This will be 90%+ faster than direct queries!
  };
}`}
          </pre>
          <p><strong>For automatic data fetching:</strong></p>
          <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`import { useTableSchema } from '@/hooks/useSchemaOptimization';

function TableDisplay() {
  const { data, loading } = useTableSchema(['users', 'orders']);
  // Automatically optimized with caching!
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
