/**
 * useBackup Hook Tests
 * 
 * Tests for lazy loading, mutations, and query invalidation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useBackup } from '../useBackup.ts'
import BackupService from '../../services/backup-service.ts'

// Mock BackupService
vi.mock('../../services/backup-service.ts', () => ({
  default: {
    listBackups: vi.fn(),
    getBackupStatus: vi.fn(),
    createBackup: vi.fn(),
    restoreBackup: vi.fn(),
    cleanupOldBackups: vi.fn(),
  }
}))

const mockBackupService = vi.mocked(BackupService)

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBackup Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Lazy Loading', () => {
    it('should not fetch data when enabled is false', async () => {
      // Arrange
      mockBackupService.listBackups.mockResolvedValue([])
      mockBackupService.getBackupStatus.mockResolvedValue({
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalSize: 0,
        lastBackup: null
      })

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      // Assert
      expect(mockBackupService.listBackups).not.toHaveBeenCalled()
      expect(mockBackupService.getBackupStatus).not.toHaveBeenCalled()
      expect(result.current.backups).toBeUndefined()
      expect(result.current.backupStatus).toBeUndefined()
    })

    it('should fetch data when enabled is true', async () => {
      // Arrange
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'full' as const,
          size: 1024,
          status: 'completed' as const,
          tables: ['users']
        }
      ]
      const mockStatus = {
        totalBackups: 1,
        successfulBackups: 1,
        failedBackups: 0,
        totalSize: 1024,
        lastBackup: {
          id: 'backup-1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'full',
          size: 1024
        }
      }

      mockBackupService.listBackups.mockResolvedValue(mockBackups)
      mockBackupService.getBackupStatus.mockResolvedValue(mockStatus)

      // Act
      const { result } = renderHook(() => useBackup(true), {
        wrapper: createWrapper()
      })

      // Assert
      await waitFor(() => {
        expect(mockBackupService.listBackups).toHaveBeenCalled()
        expect(mockBackupService.getBackupStatus).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(result.current.backups).toEqual(mockBackups)
        expect(result.current.backupStatus).toEqual(mockStatus)
      })
    })

    it('should handle loading states correctly', async () => {
      // Arrange
      mockBackupService.listBackups.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      )
      mockBackupService.getBackupStatus.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          totalBackups: 0,
          successfulBackups: 0,
          failedBackups: 0,
          totalSize: 0,
          lastBackup: null
        }), 100))
      )

      // Act
      const { result } = renderHook(() => useBackup(true), {
        wrapper: createWrapper()
      })

      // Assert - should be loading initially
      expect(result.current.backups).toBeUndefined()
      expect(result.current.backupStatus).toBeUndefined()

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.backups).toEqual([])
        expect(result.current.backupStatus).toEqual({
          totalBackups: 0,
          successfulBackups: 0,
          failedBackups: 0,
          totalSize: 0,
          lastBackup: null
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should not retry authentication errors', async () => {
      // Arrange
      const authError = new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      mockBackupService.listBackups.mockRejectedValue(authError)
      mockBackupService.getBackupStatus.mockRejectedValue(authError)

      // Act
      const { result } = renderHook(() => useBackup(true), {
        wrapper: createWrapper()
      })

      // Assert
      await waitFor(() => {
        expect(result.current.backupsError).toBeDefined()
        expect(result.current.statusError).toBeDefined()
      })

      // Should only be called once (no retries for auth errors)
      expect(mockBackupService.listBackups).toHaveBeenCalledTimes(1)
      expect(mockBackupService.getBackupStatus).toHaveBeenCalledTimes(1)
    })

    it('should retry network errors up to 2 times', async () => {
      // Arrange
      const networkError = new Error('Failed to fetch')
      mockBackupService.listBackups.mockRejectedValue(networkError)
      mockBackupService.getBackupStatus.mockRejectedValue(networkError)

      // Act
      renderHook(() => useBackup(true), {
        wrapper: createWrapper()
      })

      // Assert
      await waitFor(() => {
        // Should retry up to 2 times (3 total attempts)
        expect(mockBackupService.listBackups).toHaveBeenCalledTimes(3)
        expect(mockBackupService.getBackupStatus).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Mutations', () => {
    it('should create backup successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Backup created',
        backupId: 'backup-123',
        size: 1024,
        timestamp: '2024-01-01T00:00:00Z'
      }
      mockBackupService.createBackup.mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      await result.current.createBackup.mutateAsync({ type: 'full' })

      // Assert
      expect(mockBackupService.createBackup).toHaveBeenCalledWith({ type: 'full' })
      expect(result.current.createBackup.isSuccess).toBe(true)
    })

    it('should restore backup successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Backup restored'
      }
      mockBackupService.restoreBackup.mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      await result.current.restoreBackup.mutateAsync({ backupId: 'backup-123' })

      // Assert
      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith({ backupId: 'backup-123' })
      expect(result.current.restoreBackup.isSuccess).toBe(true)
    })

    it('should cleanup old backups successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Old backups cleaned up'
      }
      mockBackupService.cleanupOldBackups.mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      await result.current.cleanupBackups.mutateAsync()

      // Assert
      expect(mockBackupService.cleanupOldBackups).toHaveBeenCalled()
      expect(result.current.cleanupBackups.isSuccess).toBe(true)
    })

    it('should handle mutation errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Backup creation failed')
      mockBackupService.createBackup.mockRejectedValue(mockError)

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      try {
        await result.current.createBackup.mutateAsync({ type: 'full' })
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(result.current.createBackup.isError).toBe(true)
      expect(result.current.createBackup.error).toEqual(mockError)
    })
  })

  describe('Query Invalidation', () => {
    it('should invalidate queries after successful backup creation', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Backup created',
        backupId: 'backup-123',
        size: 1024,
        timestamp: '2024-01-01T00:00:00Z'
      }
      mockBackupService.createBackup.mockResolvedValue(mockResponse)

      // Create a wrapper with a spy on invalidateQueries
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper
      })

      await result.current.createBackup.mutateAsync({ type: 'full' })

      // Assert
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['backups'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['backup-status'] })
    })

    it('should invalidate all queries after successful backup restore', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Backup restored'
      }
      mockBackupService.restoreBackup.mockResolvedValue(mockResponse)

      // Create a wrapper with a spy on invalidateQueries
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper
      })

      await result.current.restoreBackup.mutateAsync({ backupId: 'backup-123' })

      // Assert
      expect(invalidateQueriesSpy).toHaveBeenCalledWith() // No arguments = invalidate all
    })
  })

  describe('Utility Functions', () => {
    it('should provide refreshBackups function', async () => {
      // Arrange
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'full' as const,
          size: 1024,
          status: 'completed' as const,
          tables: ['users']
        }
      ]
      mockBackupService.listBackups.mockResolvedValue(mockBackups)

      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      const refreshedBackups = await result.current.refreshBackups()

      // Assert
      expect(mockBackupService.listBackups).toHaveBeenCalled()
      expect(refreshedBackups).toEqual(mockBackups)
    })
  })

  describe('Return Values', () => {
    it('should return all expected properties', () => {
      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      // Assert
      expect(result.current).toHaveProperty('backups')
      expect(result.current).toHaveProperty('backupStatus')
      expect(result.current).toHaveProperty('isBackupsLoading')
      expect(result.current).toHaveProperty('isStatusLoading')
      expect(result.current).toHaveProperty('backupsError')
      expect(result.current).toHaveProperty('statusError')
      expect(result.current).toHaveProperty('createBackup')
      expect(result.current).toHaveProperty('restoreBackup')
      expect(result.current).toHaveProperty('cleanupBackups')
      expect(result.current).toHaveProperty('isCreating')
      expect(result.current).toHaveProperty('isRestoring')
      expect(result.current).toHaveProperty('isCleaning')
      expect(result.current).toHaveProperty('refreshBackups')
    })

    it('should return mutation objects with correct properties', () => {
      // Act
      const { result } = renderHook(() => useBackup(false), {
        wrapper: createWrapper()
      })

      // Assert
      expect(result.current.createBackup).toHaveProperty('mutate')
      expect(result.current.createBackup).toHaveProperty('mutateAsync')
      expect(result.current.createBackup).toHaveProperty('isPending')
      expect(result.current.createBackup).toHaveProperty('isSuccess')
      expect(result.current.createBackup).toHaveProperty('isError')
      expect(result.current.createBackup).toHaveProperty('error')

      expect(result.current.restoreBackup).toHaveProperty('mutate')
      expect(result.current.restoreBackup).toHaveProperty('mutateAsync')
      expect(result.current.restoreBackup).toHaveProperty('isPending')
      expect(result.current.restoreBackup).toHaveProperty('isSuccess')
      expect(result.current.restoreBackup).toHaveProperty('isError')
      expect(result.current.restoreBackup).toHaveProperty('error')

      expect(result.current.cleanupBackups).toHaveProperty('mutate')
      expect(result.current.cleanupBackups).toHaveProperty('mutateAsync')
      expect(result.current.cleanupBackups).toHaveProperty('isPending')
      expect(result.current.cleanupBackups).toHaveProperty('isSuccess')
      expect(result.current.cleanupBackups).toHaveProperty('isError')
      expect(result.current.cleanupBackups).toHaveProperty('error')
    })
  })
})
