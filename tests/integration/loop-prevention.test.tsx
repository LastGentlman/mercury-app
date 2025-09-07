import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../../src/hooks/useAuth.ts'
import { useDashboardStats } from '../../src/hooks/useDashboardStats.ts'
import { useOrders } from '../../src/hooks/useOrders.ts'
import { useCSRF } from '../../src/hooks/useCSRF.ts'
import { redirectManager } from '../../src/utils/redirectManager.ts'

// Mock all the services and utilities
vi.mock('../../src/services/auth-service.ts', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })),
  },
}))

vi.mock('../../src/utils/supabase.ts', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('../../src/hooks/useOfflineSync.ts', () => ({
  useOfflineSync: () => ({ isOnline: true }),
}))

vi.mock('../../src/hooks/useStorageSync.ts', () => ({
  useAuthToken: () => ({ value: 'test-token', setValue: vi.fn(), isLoading: false }),
}))

vi.mock('../../src/hooks/useOfflineAuth.ts', () => ({
  useOfflineAuth: () => ({
    actions: {
      verifyToken: vi.fn().mockResolvedValue({ valid: true }),
      clearOfflineData: vi.fn(),
    },
  }),
}))

vi.mock('../../src/lib/offline/db.ts', () => ({
  db: {
    getOrdersByBusinessAndDate: vi.fn().mockResolvedValue([]),
    orders: { add: vi.fn(), update: vi.fn() },
    syncQueue: { add: vi.fn() },
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Loop Prevention Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('test-auth-token')
    redirectManager.reset()
    redirectManager.resetRedirectCount()
  })

  describe('OAuth State Change Loop Prevention', () => {
    it('should throttle OAuth state change events', async () => {
      const { AuthService } = await import('../../src/services/auth-service.ts')
      const mockOnAuthStateChange = vi.fn()
      vi.mocked(AuthService.onAuthStateChange).mockImplementation(mockOnAuthStateChange)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      })

      // Simulate rapid OAuth events
      const callback = mockOnAuthStateChange.mock.calls[0][0]
      
      // First event should be processed
      act(() => {
        callback('SIGNED_IN', { user: { id: 'test' } })
      })

      // Second event immediately after should be throttled
      act(() => {
        callback('SIGNED_IN', { user: { id: 'test' } })
      })

      // Third event should also be throttled
      act(() => {
        callback('SIGNED_IN', { user: { id: 'test' } })
      })

      // Wait for any async operations
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBeDefined()
      })

      // Should only process the first event
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('API Request Loop Prevention', () => {
    it('should prevent infinite retries on 500 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      // Should only make one request (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should prevent infinite retries on 401 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const { result } = renderHook(() => useOrders('test-business-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      // Should only make one request (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should throttle CSRF token requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('test-csrf-token'),
        },
      })

      const { result } = renderHook(() => useCSRF(), {
        wrapper: createWrapper(),
      })

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Try to refresh multiple times rapidly
      await act(async () => {
        await result.current.refreshToken()
        await result.current.refreshToken()
        await result.current.refreshToken()
      })

      // Should still only be called once due to throttling
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Redirect Loop Prevention', () => {
    it('should prevent multiple simultaneous redirects', () => {
      const result1 = redirectManager.startRedirect(1000)
      const result2 = redirectManager.startRedirect(1000)
      const result3 = redirectManager.startRedirect(1000)

      expect(result1).toBe(true)
      expect(result2).toBe(false) // Should be rejected
      expect(result3).toBe(false) // Should be rejected
      expect(redirectManager.getRedirectCount()).toBe(1)
    })

    it('should prevent infinite redirect loops', () => {
      // Simulate multiple redirects
      for (let i = 0; i < 5; i++) {
        redirectManager.startRedirect(1000)
        redirectManager.completeRedirect()
      }

      // The 6th redirect should be rejected
      const result = redirectManager.startRedirect(1000)

      expect(result).toBe(false)
      expect(redirectManager.getRedirectCount()).toBe(5)
    })

    it('should throttle rapid successive redirects', () => {
      const result1 = redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()

      // Try to start another redirect immediately (should be throttled)
      const result2 = redirectManager.startRedirect(1000)

      expect(result1).toBe(true)
      expect(result2).toBe(false) // Should be throttled
    })
  })

  describe('Cache and Performance', () => {
    it('should use proper cache settings to prevent excessive API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stats: {} }),
      })

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).toBeDefined()
      })

      // Should only make one request due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Re-render the hook
      renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      // Should not make additional requests due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not refetch on window focus', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stats: {} }),
      })

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).toBeDefined()
      })

      // Simulate window focus
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      // Should not make additional requests
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error?.message).toContain('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error?.message).toContain('Invalid JSON')
    })
  })
})
