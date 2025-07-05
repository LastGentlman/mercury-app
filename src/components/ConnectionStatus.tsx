import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { cn } from '../lib/utils'

export function ConnectionStatus() {
  const { isOnline, syncStatus, pendingCount, syncPendingChanges } = useOfflineSync()

  if (isOnline && pendingCount === 0) {
    return null // No mostrar si está online y no hay items pendientes
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
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
                {syncStatus === 'syncing' && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                {syncStatus === 'error' && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {syncStatus === 'idle' && pendingCount > 0 && (
                  <button
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
    </div>
  )
} 