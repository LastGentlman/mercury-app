import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOfflineSync } from '../../src/hooks/useOfflineSync.ts'

// Mock dependencies
vi.mock('../../src/lib/utils.ts', () => ({
  generateUUID: vi.fn(() => 'test-uuid-123')
}))

// Mock navigator.onLine
const setOnlineStatus = (status: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value: status,
    writable: true,
    configurable: true
  })
}

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token')
    setOnlineStatus(true)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.pendingCount).toBe(0)
      expect(result.current.isOnline).toBe(true)
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should detect offline state correctly', () => {
      setOnlineStatus(false)
      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('Adding Pending Changes', () => {
    it('should add pending change correctly', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({
          type: 'create',
          data: { name: 'Test Product', price: 100 }
        })
      })

      expect(result.current.pendingCount).toBe(1)
    })

    it('should increment pending count for multiple changes', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Product 1' } })
        result.current.addPendingChange({ type: 'update', data: { name: 'Product 2' } })
        result.current.addPendingChange({ type: 'delete', data: { id: '123' } })
      })

      expect(result.current.pendingCount).toBe(3)
    })

    it('should generate unique IDs for each pending change', () => {
      const { result } = renderHook(() => useOfflineSync())
      const { generateUUID } = require('../../src/lib/utils.ts')
      
      generateUUID.mockReturnValueOnce('uuid-1')
      generateUUID.mockReturnValueOnce('uuid-2')

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Product 1' } })
        result.current.addPendingChange({ type: 'create', data: { name: 'Product 2' } })
      })

      expect(generateUUID).toHaveBeenCalledTimes(2)
    })
  })

  describe('Sync Functionality', () => {
    it('should not sync when offline', async () => {
      setOnlineStatus(false)
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.pendingCount).toBe(1) // Should remain unchanged
    })

    it('should not sync when no pending changes', async () => {
      const { result } = renderHook(() => useOfflineSync())

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isSyncing).toBe(false)
    })

    it('should prevent duplicate sync calls', async () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      // Start first sync but don't await
      const syncPromise1 = act(async () => {
        await result.current.syncPendingChanges()
      })

      // Try to start second sync immediately
      await act(async () => {
        await result.current.syncPendingChanges()
      })

      // Wait for first sync to complete
      await syncPromise1

      // Should only have been called once despite multiple sync attempts
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should successfully sync pending changes', async () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({
          type: 'create',
          data: { name: 'Test Product', price: 100 }
        })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/sync/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify({
          id: 'test-uuid-123',
          data: { name: 'Test Product', price: 100 },
          timestamp: expect.any(Number)
        })
      })

      expect(result.current.pendingCount).toBe(0)
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle sync errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(result.current.error).toContain('Network error')
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.pendingCount).toBe(1) // Should remain unchanged on error
    })

    it('should handle individual item sync failures', async () => {
      // Mock one successful and one failed request
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
        .mockRejectedValueOnce(new Error('Item sync failed'))

      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Success' } })
        result.current.addPendingChange({ type: 'create', data: { name: 'Fail' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(result.current.error).toContain('Failed to sync some items')
      expect(result.current.isSyncing).toBe(false)
    })

    it('should retry failed items with exponential backoff', async () => {
      // First attempt fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })

      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      // First sync attempt (should fail)
      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(result.current.error).toContain('Network error')
      expect(result.current.pendingCount).toBe(1)

      // Reset error state by re-rendering
      const { result: result2 } = renderHook(() => useOfflineSync())

      // Second sync attempt (should succeed)
      await act(async () => {
        await result2.current.syncPendingChanges()
      })

      expect(result2.current.error).toBeNull()
    })
  })

  describe('Online/Offline Events', () => {
    it('should respond to online events', async () => {
      const { result } = renderHook(() => useOfflineSync())

      // Simulate going offline
      setOnlineStatus(false)
      globalThis.dispatchEvent(new Event('offline'))

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Simulate coming online
      setOnlineStatus(true)
      globalThis.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })

    it('should automatically sync when coming online with pending changes', async () => {
      const { result } = renderHook(() => useOfflineSync())

      // Add pending changes while offline
      setOnlineStatus(false)
      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Offline Change' } })
      })

      // Come back online
      setOnlineStatus(true)
      globalThis.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      expect(result.current.pendingCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in error state', () => {
      const { result } = renderHook(() => useOfflineSync())

      // Manually set an error state (simulating an error scenario)
      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      // Check that error handling works
      expect(result.current.error).toBeNull()
    })

    it('should handle authentication errors', async () => {
      mockLocalStorage.getItem.mockReturnValue(null) // No auth token
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/sync/create', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer null'
        })
      }))
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useOfflineSync())

      // Add some pending changes
      const { result } = renderHook(() => useOfflineSync())
      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      // Unmount should not cause memory leaks
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed sync responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad Request' })
      })

      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.pendingCount).toBe(1) // Should remain unchanged on error
    })

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.addPendingChange({ type: 'create', data: { name: 'Test' } })
      })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      expect(result.current.error).toContain('Request timeout')
    })

    it('should handle concurrent offline changes correctly', () => {
      const { result } = renderHook(() => useOfflineSync())

      // Simulate rapid concurrent changes
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addPendingChange({
            type: 'create',
            data: { name: `Product ${i}`, price: i * 10 }
          })
        }
      })

      expect(result.current.pendingCount).toBe(10)
    })
  })
}) 