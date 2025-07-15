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
  // ✅ BEST PRACTICE: Prevent duplicate sync calls
  const syncInProgressRef = useRef(false)

  // ✅ BEST PRACTICE: Proper pending count management
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

  // ✅ CRITICAL FIX: Enhanced syncPendingChanges with proper guard clauses
  const syncPendingChanges = useCallback(async () => {
    // ✅ GUARD CLAUSE 1: Don't sync when offline
    if (!isOnline) {
      console.log('⚠️ Cannot sync while offline')
      return
    }

    // ✅ GUARD CLAUSE 2: Don't sync when no pending changes
    if (pendingChanges.length === 0) {
      console.log('📝 No pending changes to sync')
      return
    }

    // ✅ GUARD CLAUSE 3: Don't sync when already syncing (CRITICAL FIX)
    if (isSyncing || syncInProgressRef.current) {
      console.log('🔄 Sync already in progress, skipping duplicate sync call')
      return
    }

    // ✅ BEST PRACTICE: Set both state and ref for immediate protection
    setIsSyncing(true)
    syncInProgressRef.current = true
    setError(null)

    try {
      console.log(`🔄 Syncing ${pendingChanges.length} pending changes...`)

      // ✅ BEST PRACTICE: Process each pending change with proper error handling
      const syncPromises = pendingChanges.map(async (item) => {
        try {
          // ✅ BEST PRACTICE: Simulate API call with proper authentication
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

      // ✅ BEST PRACTICE: Handle results with proper error aggregation
      const results = await Promise.allSettled(syncPromises)
      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ success: true; item: OfflineSyncItem; result: any }> => 
          result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.item)

      const failed = results
        .filter((result): result is PromiseFulfilledResult<{ success: false; item: OfflineSyncItem; error: string }> => 
          result.status === 'fulfilled' && !result.value.success)
        .map(result => result.value)

      // ✅ BEST PRACTICE: Update state only if component is still mounted
      if (!isMountedRef.current) return

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
        
        // ✅ BEST PRACTICE: Increment retry count for failed items
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
      // ✅ CRITICAL FIX: Always clear both state and ref
      if (isMountedRef.current) {
        setIsSyncing(false)
      }
      syncInProgressRef.current = false
    }
  }, [isOnline, pendingChanges, isSyncing]) // ✅ BEST PRACTICE: Include isSyncing in dependencies

  // ✅ BEST PRACTICE: Network status monitoring with proper cleanup
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online - attempting to sync pending changes')
      setIsOnline(true)
      setError(null)
      
      // ✅ BEST PRACTICE: Debounced sync to ensure connection stability
      setTimeout(() => {
        if (isMountedRef.current && pendingChanges.length > 0 && !syncInProgressRef.current) {
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

  // ✅ BEST PRACTICE: Component cleanup
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      syncInProgressRef.current = false
    }
  }, [])

  // ✅ BEST PRACTICE: Auto-sync when conditions are met
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0 && !isSyncing && !syncInProgressRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          syncPendingChanges()
        }
      }, 2000) // ✅ BEST PRACTICE: Wait for connection to stabilize

      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingChanges.length, isSyncing, syncPendingChanges])

  // ✅ BEST PRACTICE: Cleanup utility for failed items
  const clearFailedItems = useCallback(() => {
    setPendingChanges(prev => {
      const cleaned = prev.filter(item => item.retries < 5) // Remove items that failed 5+ times
      setPendingCount(cleaned.length)
      return cleaned
    })
  }, [])

  // ✅ BEST PRACTICE: Force sync utility (for manual triggers)
  const forceSyncPendingChanges = useCallback(async () => {
    // Reset the sync lock and force a sync
    syncInProgressRef.current = false
    setIsSyncing(false)
    await syncPendingChanges()
  }, [syncPendingChanges])

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
    forceSyncPendingChanges, // ✅ NEW: Force sync utility
    clearFailedItems,
    
    // Utilities
    hasPendingChanges: pendingCount > 0,
    canSync: isOnline && !isSyncing && !syncInProgressRef.current
  }
} 