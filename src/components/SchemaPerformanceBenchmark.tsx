/**
 * Schema Performance Benchmark Component
 * 
 * Muestra comparaciones de rendimiento entre métodos lentos y optimizados
 */

import React, { useState } from 'react';
import { getTableInfoOptimized, getForeignKeysOptimized, getTableDefinitionOptimized } from '../examples/optimized-schema-queries.ts';
import { supabase } from '../utils/supabase.ts';

interface BenchmarkResult {
  method: string;
  time: number;
  success: boolean;
  error?: string;
}

export function SchemaPerformanceBenchmark() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(['profiles', 'businesses', 'orders']);

  const tableOptions = ['profiles', 'businesses', 'orders', 'products', 'employees', 'branches'];

  // Método lento para comparar
  const getTableInfoSlow = async (tableNames: string[]) => {
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
  };

  const runBenchmark = async () => {
    setIsRunning(true);
    setResults([]);
    
    const newResults: BenchmarkResult[] = [];

    try {
      // Test 1: Información de tablas
      console.log('🧪 Testing table info queries...');
      
      // Método lento
      const startSlow = performance.now();
      try {
        await getTableInfoSlow(selectedTables);
        const endSlow = performance.now();
        newResults.push({
          method: '❌ Table Info (Lento)',
          time: endSlow - startSlow,
          success: true
        });
      } catch (error) {
        newResults.push({
          method: '❌ Table Info (Lento)',
          time: 0,
          success: false,
          error: error.message
        });
      }

      // Método optimizado (primera vez - sin caché)
      const startOpt1 = performance.now();
      try {
        await getTableInfoOptimized(selectedTables);
        const endOpt1 = performance.now();
        newResults.push({
          method: '✅ Table Info (Optimizado - Sin Caché)',
          time: endOpt1 - startOpt1,
          success: true
        });
      } catch (error) {
        newResults.push({
          method: '✅ Table Info (Optimizado - Sin Caché)',
          time: 0,
          success: false,
          error: error.message
        });
      }

      // Método optimizado (segunda vez - con caché)
      const startOpt2 = performance.now();
      try {
        await getTableInfoOptimized(selectedTables);
        const endOpt2 = performance.now();
        newResults.push({
          method: '⚡ Table Info (Optimizado - Con Caché)',
          time: endOpt2 - startOpt2,
          success: true
        });
      } catch (error) {
        newResults.push({
          method: '⚡ Table Info (Optimizado - Con Caché)',
          time: 0,
          success: false,
          error: error.message
        });
      }

      // Test 2: Foreign Keys
      console.log('🧪 Testing foreign key queries...');
      
      const startFK = performance.now();
      try {
        await getForeignKeysOptimized(selectedTables);
        const endFK = performance.now();
        newResults.push({
          method: '🔗 Foreign Keys (Optimizado)',
          time: endFK - startFK,
          success: true
        });
      } catch (error) {
        newResults.push({
          method: '🔗 Foreign Keys (Optimizado)',
          time: 0,
          success: false,
          error: error.message
        });
      }

      // Test 3: Table Definitions
      console.log('🧪 Testing table definition queries...');
      
      for (const tableName of selectedTables.slice(0, 2)) { // Solo 2 para no sobrecargar
        const startDef = performance.now();
        try {
          await getTableDefinitionOptimized(tableName);
          const endDef = performance.now();
          newResults.push({
            method: `📋 Table Def: ${tableName}`,
            time: endDef - startDef,
            success: true
          });
        } catch (error) {
          newResults.push({
            method: `📋 Table Def: ${tableName}`,
            time: 0,
            success: false,
            error: error.message
          });
        }
      }

    } catch (error) {
      console.error('Benchmark error:', error);
    } finally {
      setResults(newResults);
      setIsRunning(false);
    }
  };

  const getPerformanceImprovement = (slowTime: number, fastTime: number) => {
    if (slowTime === 0 || fastTime === 0) return 'N/A';
    const improvement = ((slowTime - fastTime) / slowTime) * 100;
    return `${improvement.toFixed(1)}%`;
  };

  const getTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Schema Performance Benchmark</h1>
      
      {/* Table Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Select Tables to Test</h2>
        <div className="flex flex-wrap gap-2">
          {tableOptions.map(table => (
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

      {/* Run Benchmark Button */}
      <div className="mb-6">
        <button
          onClick={runBenchmark}
          disabled={isRunning || selectedTables.length === 0}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Benchmark...' : 'Run Performance Benchmark'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Benchmark Results</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <div className="font-semibold text-sm mb-2">{result.method}</div>
                  
                  {result.success ? (
                    <div className="space-y-1">
                      <div className={`text-2xl font-bold ${getTimeColor(result.time)}`}>
                        {result.time.toFixed(1)}ms
                      </div>
                      <div className="text-xs text-gray-600">
                        {result.time < 100 ? '⚡ Excellent' : 
                         result.time < 500 ? '✅ Good' : '⚠️ Slow'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      ❌ Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          {results.length >= 3 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Slow Method:</strong> {results[0]?.time.toFixed(1)}ms
                </div>
                <div>
                  <strong>Optimized (No Cache):</strong> {results[1]?.time.toFixed(1)}ms
                </div>
                <div>
                  <strong>Optimized (With Cache):</strong> {results[2]?.time.toFixed(1)}ms
                </div>
                <div>
                  <strong>Improvement:</strong> {getPerformanceImprovement(results[0]?.time || 0, results[2]?.time || 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">How to Use This Benchmark</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Select the tables you want to test</li>
          <li>• Click "Run Performance Benchmark"</li>
          <li>• Compare the results between slow and optimized methods</li>
          <li>• The optimized method should be significantly faster, especially with cache</li>
          <li>• Use these optimized functions in your actual application code</li>
        </ul>
      </div>
    </div>
  );
}
