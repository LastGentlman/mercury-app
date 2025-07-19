import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from '../../src/components/ProtectedRoute'
import { useAuth } from '../../src/hooks/useAuth'

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
  })

  it('should show loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to auth page when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'owner' },
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should handle authentication state changes', async () => {
    // Initially loading
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Then not authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })

    // Finally authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'owner' },
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should render complex children correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'owner' },
      login: { mutateAsync: vi.fn() } as any,
      register: { mutateAsync: vi.fn() } as any,
      logout: vi.fn() as any,
      resendConfirmationEmail: { mutateAsync: vi.fn() } as any,
      refetchUser: vi.fn() as any,
    })

    const ComplexComponent = () => (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome to the protected area</p>
        <button>Click me</button>
      </div>
    )

    render(
      <ProtectedRoute>
        <ComplexComponent />
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the protected area')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
}) 