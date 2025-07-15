import { useCallback, useEffect, useRef, useState } from 'react'

interface OfflineSyncItem {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
}

export function useOfflineSync() {
  const [pendingChanges, setPendingChanges] = useState<Array<OfflineSyncItem>>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ✅ BEST PRACTICE: Memory leak prevention
  const isMountedRef = useRef(true)

  // ✅ FIXED: Proper pending count management
  const addPendingChange = useCallback((change: Omit<OfflineSyncItem, 'id' | 'timestamp' | 'retries'>) => {
    const newItem: OfflineSyncItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
      ...change
    }

    setPendingChanges(prev => {
      const updated = [...prev, newItem]
      setPendingCount(updated.length)
      return updated
    })
  }, [])

  // ✅ FIXED: Proper error handling and clearing
  const syncPendingChanges = useCallback(async () => {
    // ✅ CRITICAL FIX: Don't sync when offline
    if (!isOnline) {
      console.log('⚠️ Cannot sync while offline')
      return
    }

    if (pendingChanges.length === 0) {
      console.log('📝 No pending changes to sync')
      return
    }

    setIsSyncing(true)
    setError(null) // ✅ CRITICAL FIX: Clear error at start

    try {
      console.log(`🔄 Syncing ${pendingChanges.length} pending changes...`)

      // Process each pending change
      const syncPromises = pendingChanges.map(async (item) => {
        try {
          // Simulate API call based on operation type
          const response = await fetch(`/api/sync/${item.type}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              id: item.id,
              data: item.data,
              timestamp: item.timestamp
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          console.log(`✅ Synced item ${item.id}:`, result)
          return { success: true, item, result }
        } catch (err) {
          console.error(`❌ Failed to sync item ${item.id}:`, err)
          return { 
            success: false, 
            item, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          }
        }
      })

      const results = await Promise.allSettled(syncPromises)
      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ success: true; item: OfflineSyncItem; result: any }> => 
          result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.item)

      const failed = results
        .filter((result): result is PromiseFulfilledResult<{ success: false; item: OfflineSyncItem; error: string }> => 
          result.status === 'fulfilled' && !result.value.success)
        .map(result => result.value)

      // Remove successful items from pending list
      if (successful.length > 0) {
        setPendingChanges(prev => {
          const successfulIds = new Set(successful.map(item => item.id))
          const updated = prev.filter(item => !successfulIds.has(item.id))
          setPendingCount(updated.length)
          return updated
        })

        console.log(`✅ Successfully synced ${successful.length} items`)
      }

      // Handle failed items
      if (failed.length > 0) {
        const errorMessage = `Failed to sync ${failed.length} items`
        setError(errorMessage)
        console.error(`❌ ${errorMessage}:`, failed.map(f => f.error))
        
        // Increment retry count for failed items
        setPendingChanges(prev => 
          prev.map(item => {
            const failedItem = failed.find(f => f.item.id === item.id)
            if (failedItem) {
              return { ...item, retries: item.retries + 1 }
            }
            return item
          })
        )
      } else {
        // ✅ CRITICAL FIX: Clear error when all items sync successfully
        setError(null)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync operation failed'
      setError(errorMessage)
      console.error('❌ Sync operation failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, pendingChanges])

  // ✅ Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online - attempting to sync pending changes')
      setIsOnline(true)
      setError(null) // Clear offline errors
      
      // Attempt sync after a short delay to ensure connection is stable
      setTimeout(() => {
        if (isMountedRef.current && pendingChanges.length > 0) {
          syncPendingChanges()
        }
      }, 1000)
    }

    const handleOffline = () => {
      console.log('📴 Gone offline - queuing changes for later sync')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingChanges, syncPendingChanges])

  // ✅ Component cleanup
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ✅ Initial sync attempt if there are pending changes and we're online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          syncPendingChanges()
        }
      }, 2000) // Wait 2 seconds after going online before syncing

      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingChanges.length, isSyncing, syncPendingChanges])

  // ✅ Clear old items (optional cleanup for items that failed too many times)
  const clearFailedItems = useCallback(() => {
    setPendingChanges(prev => {
      const cleaned = prev.filter(item => item.retries < 5) // Remove items that failed 5+ times
      setPendingCount(cleaned.length)
      return cleaned
    })
  }, [])

  return {
    // State
    pendingChanges,
    pendingCount,
    isOnline,
    isSyncing,
    error,
    
    // Actions
    addPendingChange,
    syncPendingChanges,
    clearFailedItems,
    
    // Utilities
    hasPendingChanges: pendingCount > 0,
    canSync: isOnline && !isSyncing
  }
} 