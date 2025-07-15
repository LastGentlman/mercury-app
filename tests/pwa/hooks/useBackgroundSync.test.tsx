import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBackgroundSync } from '../../../src/hooks/useBackgroundSync'

// Import the mocked modules to access their functions
import * as authModule from '../../../src/hooks/useAuth'

// Mock useAuth hook
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  }))
}))

describe('useBackgroundSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator service worker with proper structure
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          sync: {
            register: vi.fn().mockResolvedValue(undefined)
          },
          periodicSync: {
            register: vi.fn().mockResolvedValue(undefined)
          },
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true,
      configurable: true
    })
    
    // Mock navigator permissions
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      writable: true,
      configurable: true
    })
    
    // Mock ServiceWorkerRegistration prototype
    Object.defineProperty(window, 'ServiceWorkerRegistration', {
      value: {
        prototype: {
          sync: {
            register: vi.fn().mockResolvedValue(undefined)
          }
        }
      },
      writable: true,
      configurable: true
    })
  })

  describe('Initial State', () => {
    it('should initialize with default sync status', () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      expect(result.current.syncStatus.isSyncing).toBe(false)
      expect(result.current.syncStatus.lastSyncTime).toBeNull()
      expect(result.current.syncStatus.lastSyncError).toBeNull()
      expect(result.current.syncStatus.itemsSynced).toBe(0)
    })

    it('should provide sync functions', () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      expect(typeof result.current.triggerBackgroundSync).toBe('function')
      expect(typeof result.current.requestPeriodicSync).toBe('function')
      expect(typeof result.current.getSyncStats).toBe('function')
    })

    it('should check if background sync is supported', () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      expect(result.current.isSupported).toBeDefined()
    })
  })

  describe('triggerBackgroundSync', () => {
    it('should trigger background sync successfully', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.triggerBackgroundSync()
      
      expect(success).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.triggerBackgroundSync()
      
      expect(success).toBe(false)
    })

    it('should handle sync registration errors', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      // Mock service worker to throw error
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            sync: {
              register: vi.fn().mockRejectedValue(new Error('Sync failed'))
            },
            periodicSync: {
              register: vi.fn().mockResolvedValue(undefined)
            }
          }),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        },
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.triggerBackgroundSync()
      
      expect(success).toBe(false)
    })

    it('should return false when background sync is not supported', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      // Remove service worker support
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.triggerBackgroundSync()
      
      expect(success).toBe(false)
    })
  })

  describe('requestPeriodicSync', () => {
    it('should request periodic sync when supported and permitted', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.requestPeriodicSync()
      
      expect(success).toBe(true)
    })

    it('should return false when permission is denied', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      // Mock permission denied
      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: vi.fn().mockResolvedValue({ state: 'denied' })
        },
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.requestPeriodicSync()
      
      expect(success).toBe(false)
    })

    it('should return false when periodic sync is not supported', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      // Remove periodic sync support
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            sync: {
              register: vi.fn().mockResolvedValue(undefined)
            },
            periodicSync: undefined
          }),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        },
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const success = await result.current.requestPeriodicSync()
      
      expect(success).toBe(false)
    })

    it('should return false when user is not authenticated', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
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
      
      expect(stats).toHaveProperty('isEnabled')
      expect(stats).toHaveProperty('hasUser')
      expect(stats).toHaveProperty('lastSync')
      expect(stats).toHaveProperty('errorCount')
      expect(stats).toHaveProperty('totalItems')
    })

    it('should handle errors gracefully', () => {
      // Mock service worker to throw error
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useBackgroundSync())
      
      const stats = result.current.getSyncStats()
      
      expect(stats.isEnabled).toBe(false)
    })

    it('should include last sync time when available', () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      // Set last sync time
      result.current.syncStatus.lastSyncTime = new Date().toISOString()
      
      const stats = result.current.getSyncStats()
      
      expect(stats.lastSync).toBeDefined()
    })
  })

  describe('Service Worker Message Handling', () => {
    it('should handle sync started messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      // Simulate sync started
      result.current.syncStatus.isSyncing = true
      
      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(true)
      })
    })

    it('should handle sync completed messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      // Simulate sync completed
      result.current.syncStatus.isSyncing = false
      result.current.syncStatus.lastSyncTime = new Date().toISOString()
      
      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.lastSyncTime).toBeDefined()
      })
    })

    it('should handle sync error messages', async () => {
      const { result } = renderHook(() => useBackgroundSync())
      
      // Simulate sync error
      result.current.syncStatus.isSyncing = false
      result.current.syncStatus.lastSyncError = 'Network error'
      
      await waitFor(() => {
        expect(result.current.syncStatus.isSyncing).toBe(false)
        expect(result.current.syncStatus.lastSyncError).toBe('Network error')
      })
    })
  })
}) 