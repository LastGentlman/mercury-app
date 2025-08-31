import { useState, useEffect, useCallback } from 'react'

// Types for offline metrics
export interface OfflineMetrics {
  totalOfflineTime: number
  totalOnlineTime: number
  offlineSessions: number
  syncAttempts: number
  successfulSyncs: number
  failedSyncs: number
  averageSyncTime: number
  lastSyncTimestamp: number | null
  heartbeatSuccessRate: number
  totalHeartbeats: number
  failedHeartbeats: number
}

export interface OfflineSession {
  startTime: number
  endTime: number | null
  duration: number
  syncAttempts: number
  successfulSyncs: number
}

/**
 * 🎯 useOfflineMetrics - Hook para Monitoreo de Métricas Offline
 * 
 * Proporciona métricas detalladas sobre el uso offline:
 * - Tiempo total offline/online
 * - Sesiones offline
 * - Tasa de éxito de sincronización
 * - Métricas de heartbeat
 * - Rendimiento general
 */
export function useOfflineMetrics() {
  const [metrics, setMetrics] = useState<OfflineMetrics>({
    totalOfflineTime: 0,
    totalOnlineTime: 0,
    offlineSessions: 0,
    syncAttempts: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    lastSyncTimestamp: null,
    heartbeatSuccessRate: 100,
    totalHeartbeats: 0,
    failedHeartbeats: 0
  })

  const [currentSession, setCurrentSession] = useState<OfflineSession | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // ✅ Cargar métricas desde localStorage
  const loadMetrics = useCallback(() => {
    try {
      const stored = localStorage.getItem('offline_metrics')
      if (stored) {
        const parsed = JSON.parse(stored)
        setMetrics(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('❌ Failed to load offline metrics:', error)
    }
  }, [])

  // ✅ Guardar métricas en localStorage
  const saveMetrics = useCallback((newMetrics: Partial<OfflineMetrics>) => {
    try {
      const updated = { ...metrics, ...newMetrics }
      setMetrics(updated)
      localStorage.setItem('offline_metrics', JSON.stringify(updated))
    } catch (error) {
      console.error('❌ Failed to save offline metrics:', error)
    }
  }, [metrics])

  // ✅ Iniciar sesión offline
  const startOfflineSession = useCallback(() => {
    const session: OfflineSession = {
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      syncAttempts: 0,
      successfulSyncs: 0
    }
    setCurrentSession(session)
    console.log('📱 Offline session started')
  }, [])

  // ✅ Finalizar sesión offline
  const endOfflineSession = useCallback(() => {
    if (currentSession) {
      const endTime = Date.now()
      const duration = endTime - currentSession.startTime
      
      const updatedSession = {
        ...currentSession,
        endTime,
        duration
      }

      // Actualizar métricas
      saveMetrics({
        totalOfflineTime: metrics.totalOfflineTime + duration,
        offlineSessions: metrics.offlineSessions + 1
      })

      // Guardar sesión en historial
      const sessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]')
      sessions.push(updatedSession)
      localStorage.setItem('offline_sessions', JSON.stringify(sessions))

      setCurrentSession(null)
      console.log(`📱 Offline session ended (${duration}ms)`)
    }
  }, [currentSession, metrics, saveMetrics])

  // ✅ Registrar intento de sincronización
  const recordSyncAttempt = useCallback((success: boolean, duration: number) => {
    const newMetrics: Partial<OfflineMetrics> = {
      syncAttempts: metrics.syncAttempts + 1,
      lastSyncTimestamp: Date.now()
    }

    if (success) {
      newMetrics.successfulSyncs = metrics.successfulSyncs + 1
      newMetrics.averageSyncTime = 
        (metrics.averageSyncTime * metrics.successfulSyncs + duration) / (metrics.successfulSyncs + 1)
    } else {
      newMetrics.failedSyncs = metrics.failedSyncs + 1
    }

    saveMetrics(newMetrics)

    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        syncAttempts: prev.syncAttempts + 1,
        successfulSyncs: prev.successfulSyncs + (success ? 1 : 0)
      } : null)
    }
  }, [metrics, currentSession, saveMetrics])

  // ✅ Registrar heartbeat
  const recordHeartbeat = useCallback((success: boolean) => {
    const totalHeartbeats = metrics.totalHeartbeats + 1
    const failedHeartbeats = success ? metrics.failedHeartbeats : metrics.failedHeartbeats + 1
    
    const newMetrics: Partial<OfflineMetrics> = {
      totalHeartbeats,
      failedHeartbeats,
      heartbeatSuccessRate: ((totalHeartbeats - failedHeartbeats) / totalHeartbeats) * 100
    }

    saveMetrics(newMetrics)
  }, [metrics, saveMetrics])

  // ✅ Obtener estadísticas de sesiones
  const getSessionStats = useCallback(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]')
      if (sessions.length === 0) return null

      const totalDuration = sessions.reduce((sum: number, session: OfflineSession) => sum + session.duration, 0)
      const avgDuration = totalDuration / sessions.length
      const longestSession = Math.max(...sessions.map((s: OfflineSession) => s.duration))
      const shortestSession = Math.min(...sessions.map((s: OfflineSession) => s.duration))

      return {
        totalSessions: sessions.length,
        averageDuration: avgDuration,
        longestSession,
        shortestSession,
        totalDuration
      }
    } catch (error) {
      console.error('❌ Failed to get session stats:', error)
      return null
    }
  }, [])

  // ✅ Limpiar métricas
  const clearMetrics = useCallback(() => {
    try {
      localStorage.removeItem('offline_metrics')
      localStorage.removeItem('offline_sessions')
      setMetrics({
        totalOfflineTime: 0,
        totalOnlineTime: 0,
        offlineSessions: 0,
        syncAttempts: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        lastSyncTimestamp: null,
        heartbeatSuccessRate: 100,
        totalHeartbeats: 0,
        failedHeartbeats: 0
      })
      setCurrentSession(null)
      console.log('🧹 Offline metrics cleared')
    } catch (error) {
      console.error('❌ Failed to clear metrics:', error)
    }
  }, [])

  // ✅ Exportar métricas
  const exportMetrics = useCallback(() => {
    try {
      const sessionStats = getSessionStats()
      const exportData = {
        metrics,
        sessionStats,
        currentSession,
        exportTimestamp: Date.now(),
        version: '1.0.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `offline-metrics-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      console.log('📊 Metrics exported successfully')
    } catch (error) {
      console.error('❌ Failed to export metrics:', error)
    }
  }, [metrics, getSessionStats, currentSession])

  // ✅ Configurar listeners de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (currentSession) {
        endOfflineSession()
      }
      saveMetrics({
        totalOnlineTime: metrics.totalOnlineTime + (currentSession?.duration || 0)
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      startOfflineSession()
    }

    globalThis.window.addEventListener('online', handleOnline)
    globalThis.window.addEventListener('offline', handleOffline)
    globalThis.window.addEventListener('offline', handleOffline)

    // Cargar métricas iniciales
    loadMetrics()

    return () => {
      globalThis.window.removeEventListener('online', handleOnline)
      globalThis.window.removeEventListener('offline', handleOffline)
      globalThis.removeEventListener('offline', handleOffline)
      globalThis.window.removeEventListener('offline', handleOffline)
    }
  }, [currentSession, metrics, startOfflineSession, endOfflineSession, saveMetrics, loadMetrics])

  // ✅ Actualizar tiempo online periódicamente
  useEffect(() => {
    if (isOnline && !currentSession) {
      const interval = setInterval(() => {
        saveMetrics({
          totalOnlineTime: metrics.totalOnlineTime + 1000 // 1 segundo
        })
      }, 1000)

      return () => clearInterval(interval)
    }
    return undefined
  }, [isOnline, currentSession, metrics, saveMetrics])

  return {
    metrics,
    currentSession,
    isOnline,
    recordSyncAttempt,
    recordHeartbeat,
    getSessionStats,
    clearMetrics,
    exportMetrics
  }
}

/**
 * 🎯 Hook simplificado para métricas básicas
 */
export function useOfflineMetricsSummary() {
  const { metrics, currentSession, isOnline } = useOfflineMetrics()
  
  return {
    isCurrentlyOffline: !isOnline,
    currentOfflineDuration: currentSession ? Date.now() - currentSession.startTime : 0,
    totalOfflineTime: metrics.totalOfflineTime,
    syncSuccessRate: metrics.syncAttempts > 0 
      ? (metrics.successfulSyncs / metrics.syncAttempts) * 100 
      : 100,
    heartbeatSuccessRate: metrics.heartbeatSuccessRate,
    offlineSessions: metrics.offlineSessions
  }
} 