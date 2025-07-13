import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'

export interface BackgroundSyncStatus {
  isSyncing: boolean
  lastSyncTime: string | null
  lastSyncError: string | null
  itemsSynced: number
}

export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    lastSyncError: null,
    itemsSynced: 0
  })
  const { user } = useAuth()
  
  // Use refs to track mounted state and prevent memory leaks
  const isMountedRef = useRef(true)
  const handlersRef = useRef<{
    messageHandler?: (event: MessageEvent) => void
    authTokenHandler?: (event: MessageEvent) => void
  }>({})

  // Safe state update function
  const safeSetSyncStatus = useCallback((updater: (prev: BackgroundSyncStatus) => BackgroundSyncStatus) => {
    if (isMountedRef.current) {
      setSyncStatus(updater)
    }
  }, [])

  useEffect(() => {
    // Ensure service worker is available
    if (!('serviceWorker' in navigator)) {
      console.log('⚠️ Service Worker not supported')
      return
    }

    // Message handler with proper error handling
    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data || typeof event.data !== 'object') {
          return
        }

        const { type, timestamp, itemsCount, error } = event.data

        switch (type) {
          case 'SYNC_STARTED':
            safeSetSyncStatus(prev => ({
              ...prev,
              isSyncing: true,
              lastSyncError: null
            }))
            console.log('🔄 Background sync started')
            break

          case 'SYNC_COMPLETED':
            safeSetSyncStatus(prev => ({
              ...prev,
              isSyncing: false,
              lastSyncTime: timestamp,
              itemsSynced: itemsCount || 0
            }))
            console.log(`✅ Background sync completed: ${itemsCount || 0} items`)
            break

          case 'SYNC_ERROR':
            safeSetSyncStatus(prev => ({
              ...prev,
              isSyncing: false,
              lastSyncError: error || 'Unknown sync error',
              lastSyncTime: timestamp
            }))
            console.error('❌ Background sync failed:', error)
            break
        }
      } catch (handleError) {
        console.error('❌ Message handler error:', handleError)
      }
    }

    // Auth token handler with proper error handling
    const handleAuthTokenRequest = (event: MessageEvent) => {
      try {
        if (event.data?.type === 'GET_AUTH_TOKEN' && event.ports[0]) {
          const token = localStorage.getItem('authToken')
          event.ports[0].postMessage({ token })
        }
      } catch (authError) {
        console.error('❌ Auth token handler error:', authError)
        if (event.ports[0]) {
          event.ports[0].postMessage({ token: null })
        }
      }
    }

    // Store handlers in ref for cleanup
    handlersRef.current.messageHandler = handleMessage
    handlersRef.current.authTokenHandler = handleAuthTokenRequest

    // Add event listeners
    navigator.serviceWorker.addEventListener('message', handleMessage)
    navigator.serviceWorker.addEventListener('message', handleAuthTokenRequest)

    return () => {
      // Cleanup event listeners
      if (handlersRef.current.messageHandler) {
        navigator.serviceWorker.removeEventListener('message', handlersRef.current.messageHandler)
      }
      if (handlersRef.current.authTokenHandler) {
        navigator.serviceWorker.removeEventListener('message', handlersRef.current.authTokenHandler)
      }
      
      // Clear refs
      handlersRef.current = {}
    }
  }, [safeSetSyncStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Trigger manual background sync with proper error handling
  const triggerBackgroundSync = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated, skipping sync')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      if ('sync' in registration) {
        await (registration as any).sync.register('background-sync')
        console.log('🔄 Manual background sync triggered')
        return true
      } else {
        console.log('⚠️ Background sync not supported')
        return false
      }
    } catch (error) {
      console.error('❌ Failed to trigger background sync:', error)
      return false
    }
  }, [user])

  // Request periodic background sync with proper error handling
  const requestPeriodicSync = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated, skipping periodic sync setup')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      if ('periodicSync' in registration) {
        // Check permissions
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
    } catch (error) {
      console.error('❌ Failed to register periodic sync:', error)
      return false
    }
  }, [user])

  // Get sync statistics with error handling
  const getSyncStats = useCallback(() => {
    try {
      const stats = {
        isEnabled: 'serviceWorker' in navigator,
        hasUser: !!user,
        lastSync: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null,
        errorCount: syncStatus.lastSyncError ? 1 : 0, // Simplified for this example
        totalItems: syncStatus.itemsSynced
      }
      return stats
    } catch (error) {
      console.error('❌ Failed to get sync stats:', error)
      return {
        isEnabled: false,
        hasUser: false,
        lastSync: null,
        errorCount: 1,
        totalItems: 0
      }
    }
  }, [user, syncStatus])

  return {
    syncStatus,
    triggerBackgroundSync,
    requestPeriodicSync,
    getSyncStats,
    isSupported: 'serviceWorker' in navigator && 'sync' in (window as any)
  }
} 