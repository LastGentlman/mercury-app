import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOfflineSync } from '../../../src/hooks/useOfflineSync'

// Import the mocked modules to access their functions
import * as authModule from '../../../src/hooks/useAuth'
import * as dbModule from '../../../src/lib/offline/db'
import * as conflictResolverModule from '../../../src/lib/offline/conflictResolver'

// Mock fetch
global.fetch = vi.fn()

// Create mock UseMutationResult objects
const createMockMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false as const,
  isSuccess: false as const,
  isError: false as const,
  error: null,
  data: undefined,
  isIdle: true as const,
  status: 'idle' as const,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  variables: undefined,
  context: undefined,
  submittedAt: 0,
  abortedAt: undefined,
  promise: undefined
})

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })
    
    // Mock useAuth
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'owner' },
      isAuthenticated: true,
      isLoading: false,
      login: createMockMutation(),
      register: createMockMutation(),
      logout: createMockMutation(),
      resendConfirmationEmail: createMockMutation(),
      refetchUser: vi.fn()
    })
    
    // Mock database
    vi.mocked(dbModule.db.syncQueue.count).mockResolvedValue(0)
    vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue([])
    vi.mocked(dbModule.db.markAsSynced).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.incrementRetries).mockResolvedValue(undefined)
    
    // Mock conflict resolver
    vi.mocked(conflictResolverModule.ConflictResolver.detectConflict).mockReturnValue(false)
    vi.mocked(conflictResolverModule.ConflictResolver.resolveLastWriteWins).mockReturnValue({
      winner: 'local',
      resolvedData: { id: 1, clientGeneratedId: 'test', businessId: '1', clientName: 'Test', clientPhone: '123', clientAddress: 'Test', items: [], total: 0, status: 'pending', deliveryDate: new Date().toISOString(), syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    })
  })

  describe('Initial State', () => {
    it('should initialize with online status', () => {
      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.isOnline).toBe(true)
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.pendingCount).toBe(0)
    })

    it('should initialize with offline status when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('Online/Offline Detection', () => {
    it('should update online status when connection changes', async () => {
      const { result } = renderHook(() => useOfflineSync())

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      // Trigger offline event
      window.dispatchEvent(new Event('offline'))

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })
    })

    it('should update online status when connection is restored', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useOfflineSync())

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      // Trigger online event
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })
  })

  describe('Sync Pending Changes', () => {
    it('should sync pending changes when online', async () => {
      const mockItems = [
        { id: 1, entityType: 'order' as const, entityId: 'order1', action: 'create' as const, timestamp: new Date().toISOString() },
        { id: 2, entityType: 'product' as const, entityId: 'product1', action: 'update' as const, timestamp: new Date().toISOString() }
      ]
      
      vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue(mockItems)
      vi.mocked(dbModule.db.syncQueue.count).mockResolvedValue(2)

      const { result } = renderHook(() => useOfflineSync())

      // Trigger sync
      await result.current.syncPendingChanges()

      expect(dbModule.db.getPendingSyncItems).toHaveBeenCalled()
      expect(dbModule.db.markAsSynced).toHaveBeenCalledTimes(2)
    })

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(dbModule.db.getPendingSyncItems).not.toHaveBeenCalled()
    })

    it('should not sync when already syncing', async () => {
      const { result } = renderHook(() => useOfflineSync())

      // Start first sync
      const syncPromise1 = result.current.syncPendingChanges()
      
      // Try to start second sync
      const syncPromise2 = result.current.syncPendingChanges()

      await Promise.all([syncPromise1, syncPromise2])

      // Should only call getPendingSyncItems once
      expect(dbModule.db.getPendingSyncItems).toHaveBeenCalledTimes(1)
    })

    it('should handle sync errors gracefully', async () => {
      vi.mocked(dbModule.db.getPendingSyncItems).mockRejectedValue(new Error('Database error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(result.current.syncStatus).toBe('error')
    })

    it('should resolve conflicts when they occur', async () => {
      const mockItems = [
        { id: 1, entityType: 'order' as const, entityId: 'order1', action: 'create' as const, timestamp: new Date().toISOString() }
      ]
      
      vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue(mockItems)
      vi.mocked(conflictResolverModule.ConflictResolver.detectConflict).mockReturnValue(true)
      vi.mocked(conflictResolverModule.ConflictResolver.resolveLastWriteWins).mockReturnValue({
        winner: 'local',
        resolvedData: { id: 1, clientGeneratedId: 'test', businessId: '1', clientName: 'Test', clientPhone: '123', clientAddress: 'Test', items: [], total: 0, status: 'pending', deliveryDate: new Date().toISOString(), syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(conflictResolverModule.ConflictResolver.detectConflict).toHaveBeenCalled()
    })
  })

  describe('Pending Count', () => {
    it('should update pending count', async () => {
      const { result } = renderHook(() => useOfflineSync())

      await result.current.updatePendingCount()

      expect(dbModule.db.syncQueue.count).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should set error status when sync fails', async () => {
      vi.mocked(dbModule.db.getPendingSyncItems).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(result.current.syncStatus).toBe('error')
    })

    it('should clear error status when sync succeeds', async () => {
      // First fail
      vi.mocked(dbModule.db.getPendingSyncItems).mockRejectedValueOnce(new Error('Network error'))
      
      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()
      expect(result.current.syncStatus).toBe('error')

      // Then succeed
      vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue([])
      
      await result.current.syncPendingChanges()
      expect(result.current.syncStatus).toBe('idle')
    })
  })
}) 