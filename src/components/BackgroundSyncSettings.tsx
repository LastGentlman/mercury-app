import React, { useState } from 'react'
import { useBackgroundSync } from '../hooks/useBackgroundSync'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'

export function BackgroundSyncSettings() {
  const {
    syncStatus,
    triggerBackgroundSync,
    requestPeriodicSync,
    getSyncStats,
    isSupported
  } = useBackgroundSync()

  const [periodicSyncEnabled, setPeriodicSyncEnabled] = useState(false)
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  const stats = getSyncStats()

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    try {
      await triggerBackgroundSync()
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsManualSyncing(false)
    }
  }

  const handlePeriodicSyncToggle = async (enabled: boolean) => {
    setPeriodicSyncEnabled(enabled)
    if (enabled) {
      try {
        await requestPeriodicSync()
      } catch (error) {
        console.error('Periodic sync setup failed:', error)
        setPeriodicSyncEnabled(false)
      }
    }
  }

  // ✅ BEST PRACTICE: Early return for unsupported features
  if (!isSupported) {
    return (
      <Card data-testid="card">
        <CardHeader>
          <h3>Background Sync</h3>
          <p className="text-muted-foreground">
            Background sync is not supported in this browser
          </p>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card data-testid="card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3>Background Sync Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage data synchronization when offline
            </p>
          </div>
          {syncStatus.isSyncing && (
            <Badge variant="outline">
              Syncing...
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Status Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge 
              variant={stats.isEnabled && stats.hasUser ? "default" : "secondary"}
            >
              {stats.isEnabled && stats.hasUser ? "Ready" : "Disabled"}
            </Badge>
          </div>
          
          {syncStatus.lastSyncTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last sync</span>
              <span>{new Date(syncStatus.lastSyncTime).toLocaleString()}</span>
            </div>
          )}
          
          {syncStatus.lastSyncError && (
            <div className="text-sm text-destructive">
              Error: {syncStatus.lastSyncError}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items synced</span>
            <span>{syncStatus.itemsSynced}</span>
          </div>
        </div>

        {/* Manual Sync Button */}
        <div className="space-y-2">
          <Button
            data-testid="button"
            onClick={handleManualSync}
            disabled={!stats.isEnabled || !stats.hasUser || isManualSyncing || syncStatus.isSyncing}
            className="w-full"
          >
            {isManualSyncing || syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Periodic Sync Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">
              Automatic Sync
            </label>
            <p className="text-xs text-muted-foreground">
              Enable periodic background synchronization
            </p>
          </div>
          <Switch
            data-testid="switch"
            checked={periodicSyncEnabled}
            onCheckedChange={handlePeriodicSyncToggle}
            disabled={!stats.isEnabled || !stats.hasUser}
          />
        </div>

        {/* Statistics */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Error count</span>
              <div className="font-medium">{stats.errorCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total items</span>
              <div className="font-medium">{stats.totalItems}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 