import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'

export interface BackgroundSyncStatus {
  isSyncing: boolean
  lastSyncTime: string | null
  lastSyncError: string | null
  itemsSynced: number
}

export function useBackgroundSync() {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    lastSyncError: null,
    itemsSynced: 0
  })

  // ✅ BEST PRACTICE: Memory leak prevention
  const isMountedRef = useRef(true)
  const handlersRef = useRef<{
    messageHandler?: (event: MessageEvent) => void
  }>({})

  // ✅ BEST PRACTICE: Safe state updates with mount checking
  const safeSetSyncStatus = useCallback((updater: (prev: BackgroundSyncStatus) => BackgroundSyncStatus) => {
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

      const { type, timestamp, itemsCount, error } = event.data

      // Handle auth token requests
      if (type === 'GET_AUTH_TOKEN' && event.ports && event.ports[0]) {
        try {
          const token = localStorage.getItem('authToken')
          event.ports[0].postMessage({ token })
        } catch (err) {
          console.error('Failed to get auth token:', err)
          event.ports[0].postMessage({ token: null, error: err instanceof Error ? err.message : 'Unknown error' })
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
            lastSyncTime: timestamp || new Date().toISOString(),
            itemsSynced: itemsCount || prev.itemsSynced,
            lastSyncError: null
          }))
          break

        case 'SYNC_ERROR':
          safeSetSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncError: error || 'Unknown sync error'
          }))
          break
      }
    } catch (err) {
      console.error('Error handling service worker message:', err)
    }
  }, [safeSetSyncStatus])

  // ✅ BEST PRACTICE: Proper cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      
      // Cleanup message handler
      if (handlersRef.current.messageHandler && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handlersRef.current.messageHandler)
      }
    }
  }, [])

  // ✅ Service Worker message listener setup
  useEffect(() => {
    if (navigator.serviceWorker) {
      // Remove previous handler if exists
      if (handlersRef.current.messageHandler) {
        navigator.serviceWorker.removeEventListener('message', handlersRef.current.messageHandler)
      }

      // Set new handler
      handlersRef.current.messageHandler = handleServiceWorkerMessage
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }

    return () => {
      if (handlersRef.current.messageHandler && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handlersRef.current.messageHandler)
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
      if (navigator.serviceWorker && window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('background-sync')
        console.log('✅ Background sync triggered')
        return true
      } else {
        console.log('⚠️ Background sync not supported')
        return false
      }
    } catch (err) {
      console.error('❌ Failed to trigger background sync:', err)
      safeSetSyncStatus(prev => ({
        ...prev,
        lastSyncError: err instanceof Error ? err.message : 'Failed to trigger sync'
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
      
      if ('periodicSync' in registration) {
        // Check permissions first
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName
        })
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('periodic-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          })
          console.log('✅ Periodic background sync registered')
          return true
        } else {
          console.log('⚠️ Periodic background sync permission not granted')
          return false
        }
      } else {
        console.log('⚠️ Periodic background sync not supported')
        return false
      }
    } catch (err) {
      console.error('❌ Failed to register periodic sync:', err)
      safeSetSyncStatus(prev => ({
        ...prev,
        lastSyncError: err instanceof Error ? err.message : 'Failed to setup periodic sync'
      }))
      return false
    }
  }, [user, safeSetSyncStatus])

  // ✅ FIXED: Get sync statistics with proper error handling
  const getSyncStats = useCallback(() => {
    try {
      const isServiceWorkerSupported = !!navigator.serviceWorker
      
      // ✅ CRITICAL FIX: Return isEnabled: false when service worker is not supported
      if (!isServiceWorkerSupported) {
        return {
          isEnabled: false,
          hasUser: !!user,
          lastSync: null,
          errorCount: 1,
          totalItems: 0,
          error: 'Service Worker not supported'
        }
      }

      const stats = {
        isEnabled: true,
        hasUser: !!user,
        lastSync: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null,
        errorCount: syncStatus.lastSyncError ? 1 : 0,
        totalItems: syncStatus.itemsSynced
      }
      
      return stats
    } catch (err) {
      console.error('❌ Failed to get sync stats:', err)
      
      // ✅ CRITICAL FIX: Return isEnabled: false when error occurs
      return {
        isEnabled: false,
        hasUser: !!user,
        lastSync: null,
        errorCount: 1,
        totalItems: 0,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }, [user, syncStatus])

  // ✅ BEST PRACTICE: Feature detection
  const isSupported = !!(navigator.serviceWorker && window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype && 'sync' in window.ServiceWorkerRegistration.prototype)

  return {
    syncStatus,
    triggerBackgroundSync,
    requestPeriodicSync,
    getSyncStats,
    isSupported
  }
}