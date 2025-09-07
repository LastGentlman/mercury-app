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
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
}

vi.mock('../../src/utils/supabase.ts', () => ({
  supabase: mockSupabase,
}))

describe('useCSRF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
  })

  it('should initialize with session ID', () => {
    const { result } = renderHook(() => useCSRF())
    
    expect(result.current.sessionId).toBeDefined()
    expect(typeof result.current.sessionId).toBe('string')
  })

  it('should fetch CSRF token on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('test-csrf-token'),
      },
    })

    const { result } = renderHook(() => useCSRF())
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/csrf/token'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Session-ID': result.current.sessionId,
          }),
        })
      )
    })
  })

  it('should handle CSRF token refresh with throttling', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('test-csrf-token'),
      },
    })

    const { result } = renderHook(() => useCSRF())
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // Try to refresh immediately (should be throttled)
    const token1 = await result.current.refreshToken()
    const token2 = await result.current.refreshToken()
    
    expect(mockFetch).toHaveBeenCalledTimes(1) // Should not make additional calls
    expect(token1).toBe('test-csrf-token')
    expect(token2).toBe('test-csrf-token') // Should return existing token
  })

  it('should handle authentication errors gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSupabase.auth.getSession.mockResolvedValue({
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
    })

    const { result } = renderHook(() => useCSRFRequest())
    
    await result.current.csrfRequest('/api/test')
    
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-auth-token',
          'X-Session-ID': expect.any(String),
        }),
      })
    )
  })

  it('should handle missing auth token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useCSRFRequest())
    
    const response = await result.current.csrfRequest('/api/test')
    
    expect(response.status).toBe(401)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should retry with new CSRF token on 403', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: vi.fn().mockReturnValue('true'),
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('new-csrf-token'),
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

    const { result } = renderHook(() => useCSRFRequest())
    
    await result.current.csrfRequest('/api/test', { method: 'POST' })
    
    expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + CSRF refresh + retry
  })
})
