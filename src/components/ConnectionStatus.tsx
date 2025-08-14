import { AlertCircle, CheckCircle, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useOfflineSync } from '../hooks/useOfflineSync.ts'
import { useBackgroundSync } from '../hooks/useBackgroundSync.ts'
import { cn } from '../lib/utils.ts'

export function ConnectionStatus() {
  const { isOnline, pendingCount, syncPendingChanges } = useOfflineSync()
  const { syncStatus: bgSyncStatus, triggerBackgroundSync } = useBackgroundSync()

  // Show background sync status if available
  const showBackgroundSync = bgSyncStatus.isSyncing || bgSyncStatus.lastSyncTime || bgSyncStatus.lastSyncError

  if (isOnline && pendingCount === 0 && !showBackgroundSync) {
    return null // No mostrar si está online, no hay items pendientes y no hay background sync
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {/* Connection Status */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all",
        isOnline 
          ? "bg-green-100 text-green-800 border border-green-200" 
          : "bg-red-100 text-red-800 border border-red-200"
      )}>
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Online</span>
            {pendingCount > 0 && (
              <>
                <span className="text-xs">•</span>
                <span>{pendingCount} pending</span>
                {bgSyncStatus.isSyncing && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                {bgSyncStatus.lastSyncError && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {!bgSyncStatus.isSyncing && !bgSyncStatus.lastSyncError && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={syncPendingChanges}
                    className="text-xs underline hover:no-underline"
                    title="Sync pending changes"
                  >
                    Sync now
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Offline</span>
            {pendingCount > 0 && (
              <>
                <span className="text-xs">•</span>
                <span>{pendingCount} pending</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Background Sync Status */}
      {showBackgroundSync && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all",
          bgSyncStatus.isSyncing
            ? "bg-blue-100 text-blue-800 border border-blue-200"
            : bgSyncStatus.lastSyncError
            ? "bg-orange-100 text-orange-800 border border-orange-200"
            : "bg-green-100 text-green-800 border border-green-200"
        )}>
          {bgSyncStatus.isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Background sync...</span>
            </>
          ) : bgSyncStatus.lastSyncError ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Background sync failed</span>
              <button
                type="button"
                onClick={triggerBackgroundSync}
                className="text-xs underline hover:no-underline"
                title="Retry background sync"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Background sync active</span>
              {bgSyncStatus.lastSyncTime && (
                <>
                  <span className="text-xs">•</span>
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {new Date(bgSyncStatus.lastSyncTime).toLocaleTimeString()}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
} 