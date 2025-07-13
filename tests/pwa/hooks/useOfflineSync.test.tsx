import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOfflineSync } from '../../../src/hooks/useOfflineSync'

// Mock offline database
vi.mock('../../../src/lib/offline/db', () => ({
  db: {
    syncQueue: {
      count: vi.fn()
    },
    getPendingSyncItems: vi.fn(),
    markAsSynced: vi.fn(),
    incrementRetries: vi.fn()
  }
}))

// Mock conflict resolver
vi.mock('../../../src/lib/offline/conflictResolver', () => ({
  ConflictResolver: {
    resolve: vi.fn()
  }
}))

// Mock useAuth hook
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock useCSRF hook
vi.mock('../../../src/hooks/useCSRF', () => ({
  useCSRFRequest: vi.fn()
}))

// Mock fetch
global.fetch = vi.fn()

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    })
    
    // Mock useAuth
    const { useAuth } = require('../../../src/hooks/useAuth')
    useAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false
    })
    
    // Mock useCSRF
    const { useCSRFRequest } = require('../../../src/hooks/useCSRF')
    useCSRFRequest.mockReturnValue({
      csrfRequest: vi.fn()
    })
    
    // Mock database
    const { db } = require('../../../src/lib/offline/db')
    db.syncQueue.count.mockResolvedValue(0)
    db.getPendingSyncItems.mockResolvedValue([])
    db.markAsSynced.mockResolvedValue(undefined)
    db.incrementRetries.mockResolvedValue(undefined)
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
        writable: true
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
        writable: true
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
        writable: true
      })

      const { result } = renderHook(() => useOfflineSync())

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })
      
      // Trigger online event
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })
  })

  describe('Pending Count Updates', () => {
    it('should update pending count from database', async () => {
      const { db } = require('../../../src/lib/offline/db')
      db.syncQueue.count.mockResolvedValue(5)

      const { result } = renderHook(() => useOfflineSync())

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(5)
      })
    })

    it('should update pending count periodically', async () => {
      const { db } = require('../../../src/lib/offline/db')
      db.syncQueue.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)

      renderHook(() => useOfflineSync())

      // Wait for periodic updates
      await waitFor(() => {
        expect(db.syncQueue.count).toHaveBeenCalledTimes(3)
      }, { timeout: 1000 })
    })
  })

  describe('Sync Pending Changes', () => {
    it('should sync pending items when online', async () => {
      const { db } = require('../../../src/lib/offline/db')
      const mockItems = [
        { id: 1, entityType: 'order', entityId: 'order1', data: {} },
        { id: 2, entityType: 'product', entityId: 'product1', data: {} }
      ]
      
      db.getPendingSyncItems.mockResolvedValue(mockItems)
      db.syncQueue.count.mockResolvedValue(2)

      const { result } = renderHook(() => useOfflineSync())

      // Trigger sync
      await result.current.syncPendingChanges()

      expect(db.getPendingSyncItems).toHaveBeenCalled()
      expect(db.markAsSynced).toHaveBeenCalledTimes(2)
    })

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      const { db } = require('../../../src/lib/offline/db')
      expect(db.getPendingSyncItems).not.toHaveBeenCalled()
    })

    it('should not sync when already syncing', async () => {
      const { result } = renderHook(() => useOfflineSync())

      // Start first sync
      const syncPromise1 = result.current.syncPendingChanges()
      
      // Try to start second sync
      const syncPromise2 = result.current.syncPendingChanges()

      await Promise.all([syncPromise1, syncPromise2])

      const { db } = require('../../../src/lib/offline/db')
      expect(db.getPendingSyncItems).toHaveBeenCalledTimes(1)
    })

    it('should not sync when user is not authenticated', async () => {
      const { useAuth } = require('../../../src/hooks/useAuth')
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      const { db } = require('../../../src/lib/offline/db')
      expect(db.getPendingSyncItems).not.toHaveBeenCalled()
    })
  })

  describe('Sync Order Items', () => {
    it('should sync order items successfully', async () => {
      const { db } = require('../../../src/lib/offline/db')
      const mockItems = [
        { id: 1, entityType: 'order', entityId: 'order1', data: { customer: 'John' } }
      ]
      
      db.getPendingSyncItems.mockResolvedValue(mockItems)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John')
        })
      )
    })

    it('should handle order sync errors', async () => {
      const { db } = require('../../../src/lib/offline/db')
      const mockItems = [
        { id: 1, entityType: 'order', entityId: 'order1', data: {} }
      ]
      
      db.getPendingSyncItems.mockResolvedValue(mockItems)
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(db.incrementRetries).toHaveBeenCalledWith(1, 'Network error')
    })
  })

  describe('Sync Product Items', () => {
    it('should sync product items successfully', async () => {
      const { db } = require('../../../src/lib/offline/db')
      const mockItems = [
        { id: 1, entityType: 'product', entityId: 'product1', data: { name: 'Product A' } }
      ]
      
      db.getPendingSyncItems.mockResolvedValue(mockItems)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Product A')
        })
      )
    })

    it('should handle product sync errors', async () => {
      const { db } = require('../../../src/lib/offline/db')
      const mockItems = [
        { id: 1, entityType: 'product', entityId: 'product1', data: {} }
      ]
      
      db.getPendingSyncItems.mockResolvedValue(mockItems)
      global.fetch = vi.fn().mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(db.incrementRetries).toHaveBeenCalledWith(1, 'Server error')
    })
  })

  describe('Background Sync Integration', () => {
    it('should trigger background sync when coming back online with pending items', async () => {
      const { db } = require('../../../src/lib/offline/db')
      db.syncQueue.count.mockResolvedValue(3)

      // Mock service worker
      const mockRegistration = {
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      }
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration)
        },
        writable: true
      })

      renderHook(() => useOfflineSync())

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })
      
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(mockRegistration.sync.register).toHaveBeenCalledWith('background-sync')
      })
    })

    it('should not trigger background sync when no pending items', () => {
      const { db } = require('../../../src/lib/offline/db')
      db.syncQueue.count.mockResolvedValue(0)

      const mockRegistration = {
        sync: {
          register: vi.fn()
        }
      }
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration)
        },
        writable: true
      })

      renderHook(() => useOfflineSync())

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })
      
      window.dispatchEvent(new Event('online'))

      // Should not call background sync
      expect(mockRegistration.sync.register).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { db } = require('../../../src/lib/offline/db')
      db.getPendingSyncItems.mockRejectedValue(new Error('Database error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(result.current.syncStatus).toBe('error')
    })

    it('should handle network errors gracefully', async () => {
      const { db } = require('../../../src/lib/offline/db')
      db.getPendingSyncItems.mockResolvedValue([
        { id: 1, entityType: 'order', entityId: 'order1', data: {} }
      ])
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOfflineSync())

      await result.current.syncPendingChanges()

      expect(result.current.syncStatus).toBe('error')
    })
  })
}) 