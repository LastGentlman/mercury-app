import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from '../../src/components/ProtectedRoute'
import { useAuth } from '../../src/hooks/useAuth'
import { createMockMutation } from '../hooks/setup-auth'
import type { AuthHookReturn } from '../../src/types/auth'

// Mock the useAuth hook
vi.mock('../../src/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

// Mock the router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper function to create complete useAuth mock
function createMockUseAuth(overrides: Partial<AuthHookReturn> = {}): AuthHookReturn {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    provider: 'email' as const,
    
    // Mutation objects with all required properties
    login: createMockMutation(),
    register: createMockMutation(),
    logout: createMockMutation(),
    resendConfirmationEmail: createMockMutation(),
    socialLogin: createMockMutation(),
    
    // Utility functions
    refetchUser: vi.fn().mockResolvedValue(null),
    
    // OAuth convenience methods
    loginWithGoogle: vi.fn(),
    loginWithFacebook: vi.fn(),
    
    // Loading states
    isLoginLoading: false,
    isRegisterLoading: false,
    isLogoutLoading: false,
    isSocialLoginLoading: false,
    
    // Apply overrides
    ...overrides
  }
}

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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('should show loading state when authentication is loading', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect to auth when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })
  })

  it('should render children when user is authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'owner',
        provider: 'email'
      },
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should show loading state when authentication is still loading', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect to auth when loading completes and user is not authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })
  })

  it('should not redirect when user is authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'owner',
        provider: 'email'
      },
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()

    // Wait a bit to make sure no delayed navigation occurs
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should render children and not show loading when authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockUseAuth({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'owner',
        provider: 'email'
      },
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
}) 