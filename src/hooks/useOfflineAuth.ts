import { useCallback, useEffect, useState } from 'react'
import { offlineAuthManager } from '../services/offline-auth-manager.ts'
import { offlineAwareHeartbeat } from '../services/offline-aware-heartbeat.ts'
import type { AuthResult } from '../services/offline-auth-manager.ts'

// Types for offline auth hook
export interface OfflineAuthState {
  isOnline: boolean
  isInGracePeriod: boolean
  pendingVerifications: number
  invalidTokens: number
  authMode: 'online' | 'offline_grace' | 'offline_strict' | 'sync_pending'
  lastSync: number | null
}

export interface OfflineAuthActions {
  verifyToken: (token: string) => Promise<AuthResult>
  syncPendingVerifications: () => Promise<void>
  forceLogout: () => void
  clearOfflineData: () => void
  startHeartbeat: () => void
  stopHeartbeat: () => void
  forceHeartbeat: () => Promise<void>
}

/**
 * 🎯 useOfflineAuth - Hook para Autenticación Offline Híbrida
 * 
 * Integra el sistema de autenticación offline con:
 * - Verificación híbrida de tokens
 * - Sincronización automática cuando vuelve la conexión
 * - Heartbeat offline-aware
 * - Estados visuales para el usuario
 */
export function useOfflineAuth() {
  const [state, setState] = useState<OfflineAuthState>({
    isOnline: navigator.onLine,
    isInGracePeriod: false,
    pendingVerifications: 0,
    invalidTokens: 0,
    authMode: 'online',
    lastSync: null
  })

  const [isSyncing, setIsSyncing] = useState(false)

  // ✅ Actualizar estado de autenticación offline
  const updateOfflineAuthState = useCallback(async () => {
    try {
      const status = await offlineAuthManager.getOfflineAuthStatus()
      
      let authMode: OfflineAuthState['authMode'] = 'online'
      
      if (isSyncing) {
        authMode = 'sync_pending'
      } else if (!status.isOnline) {
        if (status.isInGracePeriod) {
          authMode = 'offline_grace'
        } else {
          authMode = 'offline_strict'
        }
      }

      setState(prev => ({
        ...prev,
        isOnline: status.isOnline,
        isInGracePeriod: status.isInGracePeriod,
        pendingVerifications: status.pendingVerifications,
        invalidTokens: status.invalidTokens,
        authMode
      }))
    } catch (error) {
      console.error('❌ Failed to update offline auth state:', error)
    }
  }, [isSyncing])

  // ✅ Verificar token con sistema híbrido
  const verifyToken = useCallback(async (token: string): Promise<AuthResult> => {
    try {
      const result = await offlineAuthManager.verifyToken(token)
      
      // Actualizar estado después de verificación
      await updateOfflineAuthState()
      
      return result
    } catch (error) {
      console.error('❌ Token verification failed:', error)
      return { valid: false, reason: 'invalid_structure' }
    }
  }, [updateOfflineAuthState])

  // ✅ Sincronizar verificaciones pendientes
  const syncPendingVerifications = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      console.log('📱 Still offline, skipping sync')
      return
    }

    setIsSyncing(true)
    try {
      await offlineAuthManager.syncPendingVerifications()
      setState(prev => ({ ...prev, lastSync: Date.now() }))
      console.log('✅ Pending verifications synced')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      setIsSyncing(false)
      await updateOfflineAuthState()
    }
  }, [updateOfflineAuthState])

  // ✅ Forzar logout
  const forceLogout = useCallback((): void => {
    try {
      // Limpiar datos offline
      offlineAuthManager.clearOfflineData()
      
      // Detener heartbeat
      offlineAwareHeartbeat.stop()
      
      // Limpiar localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // Redirigir a login
      globalThis.window.location.href = '/auth'
    } catch (error) {
      console.error('❌ Force logout failed:', error)
    }
  }, [])

  // ✅ Limpiar datos offline
  const clearOfflineData = useCallback((): void => {
    offlineAuthManager.clearOfflineData()
    updateOfflineAuthState()
  }, [updateOfflineAuthState])

  // ✅ Iniciar heartbeat
  const startHeartbeat = useCallback((): void => {
    offlineAwareHeartbeat.start()
  }, [])

  // ✅ Detener heartbeat
  const stopHeartbeat = useCallback((): void => {
    offlineAwareHeartbeat.stop()
  }, [])

  // ✅ Forzar heartbeat
  const forceHeartbeat = useCallback(async (): Promise<void> => {
    await offlineAwareHeartbeat.forceHeartbeat()
  }, [])

  // ✅ Configurar listeners de conectividad
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Connection restored')
      setState(prev => ({ ...prev, isOnline: true }))
      
      // Sincronizar verificaciones pendientes
      await syncPendingVerifications()
    }

    const handleOffline = () => {
      console.log('📱 Connection lost')
      setState(prev => ({ ...prev, isOnline: false }))
    }

    globalThis.window.addEventListener('online', handleOnline)
    globalThis.window.addEventListener('offline', handleOffline)

    // Actualizar estado inicial
    updateOfflineAuthState()

    return () => {
      globalThis.window.removeEventListener('online', handleOnline)
      globalThis.window.removeEventListener('offline', handleOffline)
    }
  }, [syncPendingVerifications, updateOfflineAuthState])

  // ✅ Actualizar estado periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      updateOfflineAuthState()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [updateOfflineAuthState])

  const actions: OfflineAuthActions = {
    verifyToken,
    syncPendingVerifications,
    forceLogout,
    clearOfflineData,
    startHeartbeat,
    stopHeartbeat,
    forceHeartbeat
  }

  return {
    state,
    actions,
    isSyncing
  }
}

/**
 * 🎯 Hook simplificado para verificar si el usuario puede trabajar offline
 */
export function useOfflineCapability() {
  const { state } = useOfflineAuth()
  
  return {
    canWorkOffline: state.isInGracePeriod || state.authMode === 'offline_grace',
    isOffline: !state.isOnline,
    needsSync: state.pendingVerifications > 0,
    authMode: state.authMode
  }
}

/**
 * 🎯 Hook para obtener estado de sincronización
 */
export function useSyncStatus() {
  const { state, actions, isSyncing } = useOfflineAuth()
  
  return {
    isSyncing,
    pendingVerifications: state.pendingVerifications,
    lastSync: state.lastSync,
    syncPendingVerifications: actions.syncPendingVerifications
  }
} 