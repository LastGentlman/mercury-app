/**
 * Backup Hook
 * 
 * Provides a clean API for backup operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import BackupService, { type BackupInfo, type BackupStatus, type CreateBackupRequest, type RestoreBackupRequest } from '../services/backup-service.ts'

export function useBackup(enabled: boolean = false) {
  const queryClient = useQueryClient()

  // Fetch backup list - only when enabled
  const {
    data: backups,
    isLoading: isBackupsLoading,
    error: backupsError,
    refetch: refetchBackups
  } = useQuery({
    queryKey: ['backups'],
    queryFn: BackupService.listBackups,
    enabled, // Only run when explicitly enabled
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error instanceof Error && error.message.includes('No estás autenticado')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: 1000
  })

  // Fetch backup status - only when enabled
  const {
    data: backupStatus,
    isLoading: isStatusLoading,
    error: statusError
  } = useQuery({
    queryKey: ['backup-status'],
    queryFn: BackupService.getBackupStatus,
    enabled, // Only run when explicitly enabled
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error instanceof Error && error.message.includes('No estás autenticado')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: 1000
  })

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: (request: CreateBackupRequest = {}) => BackupService.createBackup(request),
    onSuccess: () => {
      // Invalidate and refetch backup data
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      queryClient.invalidateQueries({ queryKey: ['backup-status'] })
      console.log('✅ Backup created successfully')
    },
    onError: (error) => {
      console.error('❌ Error creating backup:', error)
    }
  })

  // Restore backup mutation
  const restoreBackup = useMutation({
    mutationFn: (request: RestoreBackupRequest) => BackupService.restoreBackup(request),
    onSuccess: () => {
      // Invalidate all queries since data has been restored
      queryClient.invalidateQueries()
      console.log('✅ Backup restored successfully')
    },
    onError: (error) => {
      console.error('❌ Error restoring backup:', error)
    }
  })

  // Cleanup old backups mutation
  const cleanupBackups = useMutation({
    mutationFn: () => BackupService.cleanupOldBackups(),
    onSuccess: () => {
      // Invalidate backup data
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      queryClient.invalidateQueries({ queryKey: ['backup-status'] })
      console.log('✅ Old backups cleaned up successfully')
    },
    onError: (error) => {
      console.error('❌ Error cleaning up backups:', error)
    }
  })

  // Utility functions
  const refreshBackups = async () => {
    const result = await refetchBackups()
    return result.data
  }

  return {
    // Data
    backups: backups || [],
    backupStatus: backupStatus || null,
    
    // Loading states
    isLoading: isBackupsLoading || isStatusLoading,
    isBackupsLoading,
    isStatusLoading,
    isCreating: createBackup.isPending,
    isRestoring: restoreBackup.isPending,
    isCleaning: cleanupBackups.isPending,
    
    // Errors
    backupsError,
    statusError,
    
    // Mutations
    createBackup,
    restoreBackup,
    cleanupBackups,
    
    // Utilities
    refreshBackups
  }
}
