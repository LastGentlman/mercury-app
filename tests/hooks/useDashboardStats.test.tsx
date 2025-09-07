import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardStats } from '../../src/hooks/useDashboardStats.ts'
import { useAuth } from '../../src/hooks/useAuth.ts'
import { useOfflineSync } from '../../src/hooks/useOfflineSync.ts'

// Mock the hooks
vi.mock('../../src/hooks/useAuth.ts')
vi.mock('../../src/hooks/useOfflineSync.ts')
vi.mock('../../src/utils/supabase.ts', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
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
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('test-auth-token')
    
    // Default mock implementations
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'test-user-id',
        businessId: 'test-business-id',
        email: 'test@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
    } as any)
    
    vi.mocked(useOfflineSync).mockReturnValue({
      isOnline: true,
    } as any)
  })

  it('should fetch dashboard stats when user is authenticated', async () => {
    const mockStats = {
      today: { total: 5, pending: 2, preparing: 1, ready: 1, delivered: 1, cancelled: 0, totalAmount: 100 },
      thisMonth: { total: 20, totalAmount: 500, avgOrderValue: 25 },
      lastMonth: { total: 15, totalAmount: 400 },
      growth: { orders: 33.33, revenue: 25 },
      totals: { products: 10, clients: 5 },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ stats: mockStats }),
    })

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dashboard/stats/test-business-id'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-auth-token',
        }),
      })
    )
  })

  it('should handle 500 errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
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

    expect(result.current.error?.message).toContain('Error fetching dashboard stats')
  })

  it('should handle 401 errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error?.message).toContain('Unauthorized')
  })

  it('should not fetch when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any)

    renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should not fetch when offline', () => {
    vi.mocked(useOfflineSync).mockReturnValue({
      isOnline: false,
    } as any)

    renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should use Supabase session token when localStorage token is not available', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const mockSupabase = await import('../../src/utils/supabase.ts')
    if (mockSupabase.supabase) {
      vi.mocked(mockSupabase.supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'supabase-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: { 
              id: 'test-user',
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: '2024-01-01T00:00:00Z',
            },
          },
        },
        error: null,
      })
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ stats: {} }),
    })

    renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer supabase-token',
        }),
      })
    )
  })

  it('should handle missing auth token gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const mockSupabase = await import('../../src/utils/supabase.ts')
    if (mockSupabase.supabase) {
      vi.mocked(mockSupabase.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })
    }

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error?.message).toContain('No authentication token available')
  })

  it('should not retry on 401 or 500 errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    // Should only be called once (no retries)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
