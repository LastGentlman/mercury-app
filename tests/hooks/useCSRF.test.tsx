import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCSRF, useCSRFRequest } from '../../src/hooks/useCSRF.ts'

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

// Mock Supabase
vi.mock('../../src/utils/supabase.ts', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

describe('useCSRF', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('test-auth-token')
    
    const { supabase } = await import('../../src/utils/supabase.ts')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
  })

  it('should initialize with session ID', () => {
    const { result } = renderHook(() => useCSRF())
    
    expect(result.current.sessionId).toBeDefined()
    expect(typeof result.current.sessionId).toBe('string')
  })

  it('should fetch CSRF token when refreshToken is called', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('test-csrf-token'),
      },
    })

    const { result } = renderHook(() => useCSRF())
    
    // Call refreshToken to trigger the fetch
    const token = await result.current.refreshToken()
    
    expect(mockFetch).toHaveBeenCalled()
    expect(token).toBe('test-csrf-token')
  })

  it('should handle CSRF token refresh with throttling', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('test-csrf-token'),
      },
    })

    const { result } = renderHook(() => useCSRF())
    
    // First call should make a fetch
    const token1 = await result.current.refreshToken()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(token1).toBe('test-csrf-token')

    // Try to refresh immediately (should be throttled)
    const token2 = await result.current.refreshToken()
    
    expect(mockFetch).toHaveBeenCalledTimes(1) // Should not make additional calls
    expect(token2).toBe('test-csrf-token') // Should return existing token
  })

  it('should handle authentication errors gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const { supabase } = await import('../../src/utils/supabase.ts')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('No session'),
    })

    const { result } = renderHook(() => useCSRF())
    
    const token = await result.current.refreshToken()
    
    expect(token).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle server errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useCSRF())
    
    const token = await result.current.refreshToken()
    
    expect(token).toBeNull()
  })
})

describe('useCSRFRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('test-auth-token')
  })

  it('should make authenticated requests', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      clone: vi.fn().mockReturnThis(),
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useCSRFRequest())
    
    await result.current.csrfRequest('/api/test')
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(Request)
    )
  })

  it('should handle missing auth token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const { supabase } = await import('../../src/utils/supabase.ts')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useCSRFRequest())
    
    const response = await result.current.csrfRequest('/api/test')
    
    expect(response.status).toBe(401)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should retry with new CSRF token on 403', async () => {
    const mockResponse1 = {
      ok: false,
      status: 403,
      headers: {
        get: vi.fn().mockReturnValue('true'),
      },
      clone: vi.fn().mockReturnThis(),
    }
    
    const mockResponse2 = {
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('new-csrf-token'),
      },
      clone: vi.fn().mockReturnThis(),
    }
    
    const mockResponse3 = {
      ok: true,
      status: 200,
      clone: vi.fn().mockReturnThis(),
    }

    mockFetch
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2)
      .mockResolvedValueOnce(mockResponse3)

    const { result } = renderHook(() => useCSRFRequest())
    
    const response = await result.current.csrfRequest('/api/test', { method: 'POST' })
    
    expect(response.status).toBe(200)
    expect(mockFetch).toHaveBeenCalled()
  })
})
