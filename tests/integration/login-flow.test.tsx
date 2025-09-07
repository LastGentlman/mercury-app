import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../src/routeTree.gen.ts'

// Mock the authentication service
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

// Mock Supabase
vi.mock('../../src/utils/supabase.ts', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Login Flow Integration', () => {
  let queryClient: QueryClient
  let router: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })

    router = createRouter({
      routeTree,
      context: {
        queryClient,
      },
    })
  })

  const renderWithRouter = (initialRoute = '/auth') => {
    router.navigate({ to: initialRoute })
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )
  }

  it('should redirect authenticated users to dashboard', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      businessId: 'test-business-id',
      provider: 'email' as const,
    }

    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    renderWithRouter('/auth')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('should redirect users without business to setup', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      businessId: null,
      provider: 'email' as const,
    }

    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    renderWithRouter('/dashboard')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/setup')
    })
  })

  it('should redirect unauthenticated users to auth', async () => {
    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null)

    renderWithRouter('/dashboard')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/auth')
    })
  })

  it('should handle OAuth callback successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      businessId: 'test-business-id',
      provider: 'google' as const,
    }

    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    // Mock OAuth callback URL
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/auth/callback?code=test-code',
        pathname: '/auth/callback',
        search: '?code=test-code',
        hash: '',
      },
      writable: true,
    })

    renderWithRouter('/auth/callback')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('should prevent redirect loops', async () => {
    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null)

    renderWithRouter('/auth')

    // Wait a bit to ensure no redirects happen
    await new Promise(resolve => setTimeout(resolve, 100))

    // Should stay on auth page
    expect(router.state.location.pathname).toBe('/auth')
  })

  it('should handle authentication errors gracefully', async () => {
    const { AuthService } = await import('../../src/services/auth-service.ts')
    vi.mocked(AuthService.getCurrentUser).mockRejectedValue(new Error('Auth error'))

    renderWithRouter('/dashboard')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/auth')
    })
  })
})
