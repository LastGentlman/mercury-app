import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../../src/hooks/useAuth'
import { server } from '../setup'
import { http, HttpResponse } from 'msw'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Create a wrapper component for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    // Wait for the initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login successfully with valid credentials', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      session: { access_token: 'mock-token' }
    }

    server.use(
      http.post('*/api/auth/login', () => {
        return HttpResponse.json(mockResponse)
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.login.mutateAsync({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockResponse.user)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-token')
    })
  })

  it('should handle login failure', async () => {
    server.use(
      http.post('*/api/auth/login', () => {
        return HttpResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.login.mutateAsync({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Credenciales inválidas.')
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should register successfully with valid data', async () => {
    const mockResponse = {
      message: 'User registered successfully',
      user: { id: '2', email: 'new@example.com', name: 'New User' }
    }

    server.use(
      http.post('*/api/auth/register', () => {
        return HttpResponse.json(mockResponse)
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.register.mutateAsync({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User'
      })
    })

    await waitFor(() => {
      expect(result.current.register.isSuccess).toBe(true)
    })
  })

  it('should handle registration failure for existing email', async () => {
    server.use(
      http.post('*/api/auth/register', () => {
        return HttpResponse.json(
          { error: 'User with this email already exists.' },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.register.mutateAsync({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Ya existe una cuenta con este email.')
      }
    })

    // The error is caught, so we check that the mutation is not successful
    expect(result.current.register.isSuccess).toBe(false)
  })

  it('should logout and clear auth state', async () => {
    server.use(
      http.post('*/api/auth/logout', () => {
        return HttpResponse.json({ message: 'Logged out successfully' })
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.logout.mutate()
    })

    await waitFor(() => {
      expect(result.current.logout.isSuccess).toBe(true)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
  })

  it('should load user profile on mount if token exists', async () => {
    localStorageMock.getItem.mockReturnValue('existing-token')
    
    const mockProfile = {
      profile: { id: '1', email: 'test@example.com', name: 'Test User' }
    }

    server.use(
      http.get('*/api/auth/profile', () => {
        return HttpResponse.json(mockProfile)
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockProfile.profile)
    })
  })

  it('should handle invalid token on mount', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token')
    
    server.use(
      http.get('*/api/auth/profile', () => {
        return HttpResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    })
  })
}) 