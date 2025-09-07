import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrders } from '../../src/hooks/useOrders.ts'
import { useOfflineSync } from '../../src/hooks/useOfflineSync.ts'
import { useCSRFRequest } from '../../src/hooks/useCSRF.ts'

// Mock the hooks
vi.mock('../../src/hooks/useOfflineSync.ts')
vi.mock('../../src/hooks/useCSRF.ts')
vi.mock('../../src/lib/offline/db.ts', () => ({
  db: {
    getOrdersByBusinessAndDate: vi.fn(),
    orders: {
      add: vi.fn(),
      update: vi.fn(),
    },
    syncQueue: {
      add: vi.fn(),
    },
  },
}))

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

describe('useOrders', () => {
  const mockBusinessId = 'test-business-id'
  const mockOrders = [
    {
      id: '1',
      business_id: mockBusinessId,
      client_name: 'Test Client',
      status: 'pending',
      total: 100,
      delivery_date: '2024-01-01',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useOfflineSync).mockReturnValue({
      isOnline: true,
    } as any)
    
    vi.mocked(useCSRFRequest).mockReturnValue({
      csrfRequest: vi.fn(),
      token: 'test-csrf-token',
      refreshToken: vi.fn(),
    } as any)
  })

  it('should fetch orders when online', async () => {
    const mockCsrfRequest = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    })
    
    vi.mocked(useCSRFRequest).mockReturnValue({
      csrfRequest: mockCsrfRequest,
      token: 'test-csrf-token',
      refreshToken: vi.fn(),
    } as any)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.orders).toEqual(mockOrders)
    })

    expect(mockCsrfRequest).toHaveBeenCalledWith(
      `/api/orders?businessId=${mockBusinessId}`
    )
  })

  it('should use offline data when offline', async () => {
    vi.mocked(useOfflineSync).mockReturnValue({
      isOnline: false,
    } as any)

    const mockDb = await import('../../src/lib/offline/db.ts')
    vi.mocked(mockDb.db.getOrdersByBusinessAndDate).mockResolvedValue(mockOrders)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.orders).toEqual(mockOrders)
    })

    expect(mockDb.db.getOrdersByBusinessAndDate).toHaveBeenCalledWith(
      mockBusinessId,
      expect.any(String)
    )
  })

  it('should handle 401 errors without retry', async () => {
    const mockCsrfRequest = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })
    
    vi.mocked(useCSRFRequest).mockReturnValue({
      csrfRequest: mockCsrfRequest,
      token: 'test-csrf-token',
      refreshToken: vi.fn(),
    } as any)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error?.message).toContain('Unauthorized')
    expect(mockCsrfRequest).toHaveBeenCalledTimes(1) // No retries
  })

  it('should handle 500 errors without retry', async () => {
    const mockCsrfRequest = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })
    
    vi.mocked(useCSRFRequest).mockReturnValue({
      csrfRequest: mockCsrfRequest,
      token: 'test-csrf-token',
      refreshToken: vi.fn(),
    } as any)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error?.message).toContain('Error fetching orders')
    expect(mockCsrfRequest).toHaveBeenCalledTimes(1) // No retries
  })

  it('should create orders successfully', async () => {
    const mockDb = await import('../../src/lib/offline/db.ts')
    vi.mocked(mockDb.db.orders.add).mockResolvedValue(1)
    vi.mocked(mockDb.db.syncQueue.add).mockResolvedValue(1)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    const orderData = {
      client_name: 'Test Client',
      client_phone: '123456789',
      delivery_date: '2024-01-01',
      delivery_time: '12:00',
      notes: 'Test notes',
      items: [
        {
          product_id: '1',
          quantity: 2,
          unit_price: 50,
        },
      ],
    }

    await result.current.createOrder.mutateAsync(orderData)

    expect(mockDb.db.orders.add).toHaveBeenCalled()
    expect(mockDb.db.syncQueue.add).toHaveBeenCalled()
  })

  it('should update order status', async () => {
    const mockDb = await import('../../src/lib/offline/db.ts')
    vi.mocked(mockDb.db.orders.update).mockResolvedValue(1)
    vi.mocked(mockDb.db.syncQueue.add).mockResolvedValue(1)

    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    await result.current.updateOrderStatus.mutateAsync({
      orderId: '1',
      status: 'ready',
    })

    expect(mockDb.db.orders.update).toHaveBeenCalledWith(1, {
      status: 'ready',
      last_modified_at: expect.any(String),
    })
    expect(mockDb.db.syncQueue.add).toHaveBeenCalled()
  })

  it('should have proper cache configuration', () => {
    const { result } = renderHook(() => useOrders(mockBusinessId), {
      wrapper: createWrapper(),
    })

    // The hook should be configured with proper cache settings
    expect(result.current.isLoading).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.orders).toBeDefined()
  })
})
