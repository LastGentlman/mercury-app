import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePWARoute } from '../../src/hooks/usePWARoute'
import { useAuth } from '../../src/hooks/useAuth'
import { isPWAInstalled } from '../../src/pwa'
import { createMockMutation } from './setup-auth'
import type { AuthHookReturn } from '../../src/types/auth'

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

// Mock the dependencies
vi.mock('../../src/hooks/useAuth')
vi.mock('../../src/pwa')

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' })
}))

describe('usePWARoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to auth when PWA is installed and user is not authenticated', async () => {
    // Mock PWA as installed
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    
    // Mock user as not authenticated and not loading
    vi.mocked(useAuth).mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    }))

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })
  })

  it('should not redirect when PWA is not installed', async () => {
    // Mock PWA as not installed
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    
    // Mock user as not authenticated and not loading
    vi.mocked(useAuth).mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    }))

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should not redirect when user is authenticated', async () => {
    // Mock PWA as installed
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    
    // Mock user as authenticated and not loading
    vi.mocked(useAuth).mockReturnValue(createMockUseAuth({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User', provider: 'email' },
    }))

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should not redirect when auth is still loading', async () => {
    // Mock PWA as installed
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    
    // Mock auth as loading
    vi.mocked(useAuth).mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    }))

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should return correct values', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    vi.mocked(useAuth).mockReturnValue(createMockUseAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    }))

    const { result } = renderHook(() => usePWARoute())

    expect(result.current.isPWA).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
}) 