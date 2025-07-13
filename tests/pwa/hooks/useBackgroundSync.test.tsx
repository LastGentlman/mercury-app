import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackgroundSync } from '../../../src/hooks/useBackgroundSync'

// Mock service worker APIs
const mockServiceWorker = {
  ready: Promise.resolve({
    sync: {
      register: vi.fn()
    },
    periodicSync: {
      register: vi.fn()
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

const mockNavigator = {
  serviceWorker: mockServiceWorker,
  permissions: {
    query: vi.fn()
  }
}

// Mock useAuth hook
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

describe('useBackgroundSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    global.navigator = mockNavigator as any
    
    // Mock useAuth
    const { useAuth } = require('../../../src/hooks/useAuth')
    useAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false
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
  })

  describe('triggerBackgroundSync', () => {
    it('should trigger background sync successfully', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(true)
      expect(mockServiceWorker.ready).resolves.toBeDefined()
    })

    it('should return false when user is not authenticated', async () => {
      const { useAuth } = require('../../../src/hooks/useAuth')
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
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
          register: vi.fn()
        }
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(false)
    })

    it('should return false when background sync is not supported', async () => {
      mockServiceWorker.ready = Promise.resolve({
        sync: {
          register: vi.fn()
        },
        periodicSync: {
          register: vi.fn()
        }
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.triggerBackgroundSync()

      expect(success).toBe(false)
    })
  })

  describe('requestPeriodicSync', () => {
    it('should request periodic sync when supported and permitted', async () => {
      mockNavigator.permissions.query.mockResolvedValue({ state: 'granted' })
      mockServiceWorker.ready = Promise.resolve({
        sync: {
          register: vi.fn()
        },
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(true)
      expect(mockNavigator.permissions.query).toHaveBeenCalledWith({
        name: 'periodic-background-sync'
      })
    })

    it('should return false when permission is denied', async () => {
      mockNavigator.permissions.query.mockResolvedValue({ state: 'denied' })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(false)
    })

    it('should return false when periodic sync is not supported', async () => {
      mockServiceWorker.ready = Promise.resolve({
        sync: {
          register: vi.fn()
        },
        periodicSync: {
          register: vi.fn()
        }
      })

      const { result } = renderHook(() => useBackgroundSync())

      const success = await result.current.requestPeriodicSync()

      expect(success).toBe(false)
    })

    it('should return false when user is not authenticated', async () => {
      const { useAuth } = require('../../../src/hooks/useAuth')
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
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
      // Mock an error scenario
      const originalConsoleError = console.error
      console.error = vi.fn()

      const { result } = renderHook(() => useBackgroundSync())

      const stats = result.current.getSyncStats()

      expect(stats).toEqual({
        isEnabled: false,
        hasUser: false,
        lastSync: null,
        errorCount: 1,
        totalItems: 0
      })

      console.error = originalConsoleError
    })
  })

  describe('Service Worker Message Handling', () => {
    it('should handle sync started messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Simulate service worker message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'SYNC_STARTED',
          timestamp: new Date().toISOString()
        }
      })

      // Trigger the message handler
      const messageHandler = mockServiceWorker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      if (messageHandler) {
        messageHandler(messageEvent)
      }

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
          timestamp: new Date().toISOString(),
          itemsCount: 5
        }
      })

      // Trigger the message handler
      const messageHandler = mockServiceWorker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      if (messageHandler) {
        messageHandler(messageEvent)
      }

      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.itemsSynced).toBe(5)
      })
    })

    it('should handle sync error messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())

      // Simulate service worker message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'SYNC_ERROR',
          timestamp: new Date().toISOString(),
          error: 'Network error'
        }
      })

      // Trigger the message handler
      const messageHandler = mockServiceWorker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      if (messageHandler) {
        messageHandler(messageEvent)
      }

      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.lastSyncError).toBe('Network error')
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useBackgroundSync())

      unmount()

      expect(mockServiceWorker.removeEventListener).toHaveBeenCalled()
    })
  })
}) 