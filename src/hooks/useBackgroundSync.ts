import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'

export interface BackgroundSyncStatus {
  isSyncing: boolean
  lastSyncTime: string | null
  lastSyncError: string | null
  itemsSynced: number
}

export interface SyncStats {
  isEnabled: boolean
  hasUser: boolean
  lastSync: Date | null
  errorCount: number
  totalItems: number
  error?: string
}

export function useBackgroundSync() {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    lastSyncError: null,
    itemsSynced: 0
  })

  // ✅ Memory leak prevention
  const isMountedRef = useRef(true)
  const handlersRef = useRef<{
    messageHandler?: (event: MessageEvent) => void
  }>({})

  // ✅ Safe state updates with mount checking
  const safeSetSyncStatus = useCallback((
    updater: (prev: BackgroundSyncStatus) => BackgroundSyncStatus
  ) => {
    if (isMountedRef.current) {
      setSyncStatus(updater)
    }
  }, [])

  // ✅ Service Worker message handler
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    try {
      if (!event.data || typeof event.data !== 'object') {
        return
      }

      const { type, timestamp, itemsCount, error } = event.data as {
        type: string
        timestamp?: string
        itemsCount?: number
        error?: string
      }

      // Handle auth token requests
      if (type === 'GET_AUTH_TOKEN' && event.ports[0]) {
        try {
          const token = localStorage.getItem('authToken')
          event.ports[0].postMessage({ token })
        } catch (err) {
          console.error('Failed to get auth token:', err)
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          event.ports[0].postMessage({ token: null, error: errorMessage })
        }
        return
      }

      // Handle sync status updates
      switch (type) {
        case 'SYNC_STARTED':
          safeSetSyncStatus(prev => ({
            ...prev,
            isSyncing: true,
            lastSyncError: null
          }))
          break

        case 'SYNC_COMPLETED':
          safeSetSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: timestamp ?? new Date().toISOString(),
            itemsSynced: itemsCount ?? prev.itemsSynced,
            lastSyncError: null
          }))
          break

        case 'SYNC_ERROR':
          safeSetSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncError: error ?? 'Unknown sync error'
          }))
          break

        default:
          // Ignore unknown message types
          break
      }
    } catch (err) {
      console.error('Error handling service worker message:', err)
    }
  }, [safeSetSyncStatus])

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      
      // Cleanup message handler
      if (handlersRef.current.messageHandler) {
        navigator.serviceWorker.removeEventListener(
          'message', 
          handlersRef.current.messageHandler
        )
      }
    }
  }, [])

  // ✅ Service Worker message listener setup
  useEffect(() => {
    // Remove previous handler if exists
    if (handlersRef.current.messageHandler) {
      navigator.serviceWorker.removeEventListener(
        'message', 
        handlersRef.current.messageHandler
      )
    }

    // Set new handler
    handlersRef.current.messageHandler = handleServiceWorkerMessage
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    return () => {
      if (handlersRef.current.messageHandler) {
        navigator.serviceWorker.removeEventListener(
          'message', 
          handlersRef.current.messageHandler
        )
      }
    }
  }, [handleServiceWorkerMessage])

  // ✅ Trigger background sync with proper error handling
  const triggerBackgroundSync = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.log('⚠️ No user authenticated, skipping sync')
      return false
    }

    try {
      const isServiceWorkerSupported = Boolean(
        'sync' in window.ServiceWorkerRegistration.prototype
      )

      if (!isServiceWorkerSupported) {
        console.log('⚠️ Background sync not supported')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      
      // Type assertion for sync registration (experimental API)
      await (registration as any).sync.register('background-sync')
      console.log('✅ Background sync triggered')
      return true
    } catch (err) {
      console.error('❌ Failed to trigger background sync:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger sync'
      
      safeSetSyncStatus(prev => ({
        ...prev,
        lastSyncError: errorMessage
      }))
      return false
    }
  }, [user, safeSetSyncStatus])

  // ✅ Request periodic background sync
  const requestPeriodicSync = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.log('⚠️ No user authenticated, skipping periodic sync setup')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      if (!('periodicSync' in registration)) {
        console.log('⚠️ Periodic background sync not supported')
        return false
      }

      // Check permissions first
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      })
      
      if (status.state !== 'granted') {
        console.log('⚠️ Periodic background sync permission not granted')
        return false
      }

      // Type assertion for periodic sync registration (experimental API)
      await (registration as any).periodicSync.register('periodic-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      })
      
      console.log('✅ Periodic background sync registered')
      return true
    } catch (err) {
      console.error('❌ Failed to register periodic sync:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup periodic sync'
      
      safeSetSyncStatus(prev => ({
        ...prev,
        lastSyncError: errorMessage
      }))
      return false
    }
  }, [user, safeSetSyncStatus])

  // ✅ Get sync statistics with proper error handling
  const getSyncStats = useCallback((): SyncStats => {
    try {
      const isServiceWorkerSupported = Boolean(navigator.serviceWorker)
      
      if (!isServiceWorkerSupported) {
        return {
          isEnabled: false,
          hasUser: Boolean(user),
          lastSync: null,
          errorCount: 1,
          totalItems: 0,
          error: 'Service Worker not supported'
        }
      }

      return {
        isEnabled: true,
        hasUser: Boolean(user),
        lastSync: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null,
        errorCount: syncStatus.lastSyncError ? 1 : 0,
        totalItems: syncStatus.itemsSynced
      }
    } catch (err) {
      console.error('❌ Failed to get sync stats:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      return {
        isEnabled: false,
        hasUser: Boolean(user),
        lastSync: null,
        errorCount: 1,
        totalItems: 0,
        error: errorMessage
      }
    }
  }, [user, syncStatus])

  // ✅ Feature detection
  const isSupported = Boolean(
    'sync' in window.ServiceWorkerRegistration.prototype
  )

  return {
    syncStatus,
    triggerBackgroundSync,
    requestPeriodicSync,
    getSyncStats,
    isSupported
  }
}