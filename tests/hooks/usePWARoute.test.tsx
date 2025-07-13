import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePWARoute } from '../../src/hooks/usePWARoute'
import { useAuth } from '../../src/hooks/useAuth'
import { isPWAInstalled } from '../../src/pwa'

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
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: {} as any,
      register: {} as any,
      logout: {} as any,
      resendConfirmationEmail: {} as any,
      refetchUser: vi.fn()
    })

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
    })
  })

  it('should not redirect when PWA is not installed', async () => {
    // Mock PWA as not installed
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    
    // Mock user as not authenticated and not loading
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: {} as any,
      register: {} as any,
      logout: {} as any,
      resendConfirmationEmail: {} as any,
      refetchUser: vi.fn()
    })

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should not redirect when user is authenticated', async () => {
    // Mock PWA as installed
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    
    // Mock user as authenticated and not loading
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {} as any,
      login: {} as any,
      register: {} as any,
      logout: {} as any,
      resendConfirmationEmail: {} as any,
      refetchUser: vi.fn()
    })

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should not redirect when auth is still loading', async () => {
    // Mock PWA as installed
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    
    // Mock auth as loading
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: {} as any,
      register: {} as any,
      logout: {} as any,
      resendConfirmationEmail: {} as any,
      refetchUser: vi.fn()
    })

    renderHook(() => usePWARoute())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should return correct values', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: {} as any,
      register: {} as any,
      logout: {} as any,
      resendConfirmationEmail: {} as any,
      refetchUser: vi.fn()
    })

    const { result } = renderHook(() => usePWARoute())

    expect(result.current.isPWA).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
}) 