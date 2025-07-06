import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, timestamp, itemsCount, error } = event.data

      switch (type) {
        case 'SYNC_STARTED':
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: true,
            lastSyncError: null
          }))
          console.log('🔄 Background sync started')
          break

        case 'SYNC_COMPLETED':
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: timestamp,
            itemsSynced: itemsCount || 0
          }))
          console.log(`✅ Background sync completed: ${itemsCount} items`)
          break

        case 'SYNC_ERROR':
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncError: error,
            lastSyncTime: timestamp
          }))
          console.error('❌ Background sync failed:', error)
          break
      }
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Handle requests from service worker for auth token
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'GET_AUTH_TOKEN') {
        const token = localStorage.getItem('authToken')
        event.ports[0].postMessage({ token })
      }
    })

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Trigger manual background sync
  const triggerBackgroundSync = async () => {
    if (!user) return

    try {
      const registration = await navigator.serviceWorker.ready
      
      if ('sync' in registration) {
        await (registration as any).sync.register('background-sync')
        console.log('🔄 Manual background sync triggered')
      } else {
        console.log('⚠️ Background sync not supported')
      }
    } catch (error) {
      console.error('❌ Failed to trigger background sync:', error)
    }
  }

  // Request periodic background sync permission
  const requestPeriodicSyncPermission = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      
      if ('periodicSync' in registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName
        })
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('periodic-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours minimum
          })
          console.log('✅ Periodic background sync enabled')
          return true
        } else if (status.state === 'prompt') {
          // Note: navigator.permissions.request() is not widely supported
          // Users need to grant permission through browser settings
          console.log('⚠️ Please grant periodic background sync permission in browser settings')
          return false
        }
      }
      
      console.log('⚠️ Periodic background sync not available')
      return false
    } catch (error) {
      console.error('❌ Failed to request periodic sync permission:', error)
      return false
    }
  }

  return {
    syncStatus,
    triggerBackgroundSync,
    requestPeriodicSyncPermission
  }
} 