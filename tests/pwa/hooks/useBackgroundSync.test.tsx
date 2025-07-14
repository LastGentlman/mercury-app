import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBackgroundSync } from '../../../src/hooks/useBackgroundSync'

// Import the mocked modules to access their functions
import * as authModule from '../../../src/hooks/useAuth'

// Mock service worker APIs
const mockServiceWorker = {
  ready: Promise.resolve({
    sync: {
      register: vi.fn().mockResolvedValue(undefined)
    },
    periodicSync: {
      register: vi.fn().mockResolvedValue(undefined)
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

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

describe('useBackgroundSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: mockServiceWorker,
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'granted' })
        }
      },
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
  })

  describe('Initial State', () => {
    it('should initialize with default sync status', () => {
      const { result } = renderHook(() => useBackgroundSync())

      expect(result.current.syncStatus).toEqual({
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      })
    })

    it('should provide sync functions', () => {
      const { result } = renderHook(() => useBackgroundSync())

      expect(typeof result.current.triggerBackgroundSync).toBe('function')
      expect(typeof result.current.requestPeriodicSync).toBe('function')
      expect(typeof result.current.getSyncStats).toBe('function')
    })

    it('should check if background sync is supported', () => {
      const { result } = renderHook(() => useBackgroundSync())

      expect(result.current.isSupported).toBe(true)
    })
  })

  describe('triggerBackgroundSync', () => {
    it('should trigger background sync successfully', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: createMockMutation(),
        register: createMockMutation(),
        logout: createMockMutation(),
        resendConfirmationEmail: createMockMutation(),
        refetchUser: vi.fn()
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(false)
    })

    it('should handle sync registration errors', async () => {
      mockServiceWorker.ready = Promise.resolve({
        sync: {
          register: vi.fn().mockRejectedValue(new Error('Sync not supported'))
        },
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(false)
    })

    it('should return false when background sync is not supported', async () => {
      mockServiceWorker.ready = Promise.resolve({
        sync: undefined,
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      } as any)

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(false)
    })
  })

  describe('requestPeriodicSync', () => {
    it('should request periodic sync when supported and permitted', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(true)
    })

    it('should return false when permission is denied', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker,
          permissions: {
            query: vi.fn().mockResolvedValue({ state: 'denied' })
          }
        },
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(false)
    })

    it('should return false when periodic sync is not supported', async () => {
      mockServiceWorker.ready = Promise.resolve({
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        },
        periodicSync: undefined
      } as any)

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(false)
    })

    it('should return false when user is not authenticated', async () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: createMockMutation(),
        register: createMockMutation(),
        logout: createMockMutation(),
        resendConfirmationEmail: createMockMutation(),
        refetchUser: vi.fn()
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(false)
    })
  })

  describe('getSyncStats', () => {
    it('should return sync statistics', () => {
      const { result } = renderHook(() => useBackgroundSync())

      const stats = result.current.getSyncStats()

      expect(stats).toEqual({
        isEnabled: true,
        hasUser: true,
        lastSync: null,
        errorCount: 0,
        totalItems: 0
      })
    })

    it('should handle errors gracefully', () => {
      // Mock navigator to be undefined to test error handling
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useBackgroundSync())

      const stats = result.current.getSyncStats()

      expect(stats).toEqual({
        isEnabled: false,
        hasUser: false,
        lastSync: null,
        errorCount: 1,
        totalItems: 0
      })
    })

    it('should include last sync time when available', () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Manually update sync status to include last sync time
      result.current.syncStatus.lastSyncTime = '2024-01-01T12:00:00Z'
      result.current.syncStatus.itemsSynced = 5

      const stats = result.current.getSyncStats()

      expect(stats.lastSync).toEqual(new Date('2024-01-01T12:00:00Z'))
      expect(stats.totalItems).toBe(5)
    })
  })

  describe('Service Worker Message Handling', () => {
    it('should handle sync started messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Simulate service worker message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'SYNC_STARTED',
          timestamp: '2024-01-01T12:00:00Z'
        }
      })

      // Trigger the message handler
      window.dispatchEvent(messageEvent)

      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(true)
      })
    })

    it('should handle sync completed messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Simulate service worker message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'SYNC_COMPLETED',
          timestamp: '2024-01-01T12:00:00Z',
          itemsCount: 10
        }
      })

      // Trigger the message handler
      window.dispatchEvent(messageEvent)

      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.lastSyncTime).toBe('2024-01-01T12:00:00Z')
        expect(result.current.syncStatus.itemsSynced).toBe(10)
      })
    })

    it('should handle sync error messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Simulate service worker message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'SYNC_ERROR',
          timestamp: '2024-01-01T12:00:00Z',
          error: 'Network error'
        }
      })

      // Trigger the message handler
      window.dispatchEvent(messageEvent)

      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.lastSyncError).toBe('Network error')
      })
    })
  })
}) 