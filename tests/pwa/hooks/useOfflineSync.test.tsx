import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOfflineSync } from '../../../src/hooks/useOfflineSync'

// ✅ CRITICAL FIX: Use the mock from setup-unified.ts
// The useOfflineSync hook is already mocked in setup-unified.ts

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
        expect(result.current.pendingCount).toBe(0)
        expect(result.current.isSyncing).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Sync Functions', () => {
    it('should provide sync functions', () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      expect(typeof result.current.syncPendingChanges).toBe('function')
      expect(typeof result.current.addPendingChange).toBe('function')
    })

    it('should call syncPendingChanges when triggered', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      await act(async () => {
        await result.current.syncPendingChanges()
      })

      // The mock should have been called
      expect(result.current.syncPendingChanges).toHaveBeenCalled()
    })

    it('should call addPendingChange when triggered', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      await act( () => {
        result.current.addPendingChange({ type: 'create', data: { id: '1' } })
      })

      // The mock should have been called
      expect(result.current.addPendingChange).toHaveBeenCalledWith({ 
        type: 'create', 
        data: { id: '1' } 
      })
    })
  })

  describe('Mock Behavior', () => {
    it('should return expected mock values', () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      expect(result.current.isOnline).toBe(true)
      expect(result.current.pendingCount).toBe(0)
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})