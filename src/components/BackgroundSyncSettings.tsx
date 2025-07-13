import { useState } from 'react'
import { AlertCircle, CheckCircle, Clock, RefreshCw, Settings } from 'lucide-react'
import { useBackgroundSync } from '../hooks/useBackgroundSync'
import { BACKGROUND_SYNC_CONFIG } from '../config/backgroundSync'

export function BackgroundSyncSettings() {
  const { syncStatus, triggerBackgroundSync, requestPeriodicSync } = useBackgroundSync()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleEnablePeriodicSync = async () => {
    const enabled = await requestPeriodicSync()
    if (enabled) {
      console.log('✅ Periodic background sync enabled')
    } else {
      console.log('❌ Failed to enable periodic background sync')
    }
  }

  const formatLastSyncTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Background Sync</h3>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus.isSyncing && (
            <div className="flex items-center gap-1 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
          {syncStatus.lastSyncError && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Error</span>
            </div>
          )}
          {!syncStatus.isSyncing && !syncStatus.lastSyncError && syncStatus.lastSyncTime && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Active</span>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Status Information */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sync Status</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {syncStatus.lastSyncTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Last sync: {formatLastSyncTime(syncStatus.lastSyncTime)}</span>
                </div>
              )}
              {syncStatus.itemsSynced > 0 && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3" />
                  <span>Items synced: {syncStatus.itemsSynced}</span>
                </div>
              )}
              {syncStatus.lastSyncError && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Error: {syncStatus.lastSyncError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Sync */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Manual Sync</h4>
            <button
              onClick={triggerBackgroundSync}
              disabled={syncStatus.isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          {/* Periodic Sync */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Periodic Sync</h4>
            <p className="text-xs text-gray-500">
              Automatically sync data every 24 hours when the app is not active.
            </p>
            <button
              onClick={handleEnablePeriodicSync}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Enable Periodic Sync
            </button>
          </div>

          {/* Configuration Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-700 mb-2">Configuration</h4>
            <div className="space-y-1 text-xs text-blue-600">
              <div>Max retries: {BACKGROUND_SYNC_CONFIG.MAX_RETRIES}</div>
              <div>Batch size: {BACKGROUND_SYNC_CONFIG.BATCH_SIZE}</div>
              <div>Sync timeout: {BACKGROUND_SYNC_CONFIG.SYNC_TIMEOUT / 1000}s</div>
              <div>Min interval: {BACKGROUND_SYNC_CONFIG.MIN_INTERVAL / (1000 * 60 * 60)}h</div>
            </div>
          </div>

          {/* Browser Support Info */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-700 mb-2">Browser Support</h4>
            <div className="space-y-1 text-xs text-yellow-600">
              <div>✅ Chrome/Edge: Full support</div>
              <div>⚠️ Firefox: Limited support</div>
              <div>❌ Safari: No support</div>
              <div>⚠️ Requires HTTPS in production</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 