/**
 * Mock configuration for authentication tests
 * Creates properly structured mutation objects that match TanStack Query interface
 */

import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'
import type { UseMutationResult } from '@tanstack/react-query'
import type { AuthUser } from '../../src/types/auth'

// ✅ MSW Server para tests de useAuth
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

// Mock auth state
const mockAuthState = {
  user: null as AuthUser | null,
  isAuthenticated: false,
  isLoading: false,
  provider: 'email' as const,
  isLoginLoading: false,
  isRegisterLoading: false,
  isLogoutLoading: false,
  isSocialLoginLoading: false,
}

/**
 * Creates a properly structured mutation mock that matches TanStack Query's UseMutationResult
 */
function createMockMutation<TData = any, TError = Error, TVariables = void>(
  onSuccess?: (data?: TData) => void
): UseMutationResult<TData, TError, TVariables> {
  const mutation = {
    // Core mutation methods
    mutate: vi.fn((_variables: TVariables, _options?: any) => {
      // Simular async behavior
      setTimeout(() => {
        if (onSuccess) onSuccess()
        mutation.isSuccess = true
        mutation.isPending = false
      }, 0)
    }),
    mutateAsync: vi.fn().mockImplementation(async (_variables: TVariables) => {
      if (onSuccess) onSuccess()
      mutation.isSuccess = true
      mutation.isPending = false
      return { success: true } as TData
    }),
    reset: vi.fn(() => {
      mutation.isSuccess = false
      mutation.isPending = false
      mutation.isError = false
      mutation.error = null
      mutation.data = undefined
    }),
    
    // State properties
    isPending: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    isPaused: false,
    
    // Data properties
    data: undefined,
    error: null,
    variables: undefined,
    context: undefined,
    
    // Status and metadata
    status: 'idle' as const,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0
  }
  return mutation as UseMutationResult<TData, TError, TVariables>
}

// Export helper for creating test-specific mocks
export { createMockMutation, mockAuthState }

// ✅ Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true
})

// ✅ Mock global de fetch SOLO si es necesario
global.fetch = global.fetch || vi.fn()

// ✅ Mock de navegación
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    navigate: vi.fn(),
    state: { location: { pathname: '/' } }
  })
}))

// ✅ Mock de Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn()
}))

// ✅ Mock de utils de seguridad
vi.mock('../../src/utils/security', () => ({
  validateCSRFToken: vi.fn().mockReturnValue(true),
  generateCSRFToken: vi.fn().mockReturnValue('mock-csrf-token'),
  sanitizeInput: vi.fn((input) => input)
}))

// ✅ Mock de logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

/**
 * Optional mock for useAuth when needed (uncomment if required for specific tests)
 * 
 * vi.mock('../../src/hooks/useAuth', () => ({
 *   useAuth: vi.fn(() => ({
 *     ...mockAuthState,
 *     
 *     // Mutation objects with all required properties
 *     login: createMockMutation(() => {
 *       mockAuthState.isAuthenticated = true
 *       mockAuthState.user = { 
 *         id: '1', 
 *         email: 'test@example.com', 
 *         name: 'Test User',
 *         provider: 'email'
 *       }
 *     }),
 *     
 *     logout: createMockMutation(() => {
 *       mockAuthState.isAuthenticated = false
 *       mockAuthState.user = null
 *     }),
 *     
 *     register: createMockMutation(() => {
 *       mockAuthState.isAuthenticated = true
 *       mockAuthState.user = { 
 *         id: '2', 
 *         email: 'new@example.com', 
 *         name: 'New User',
 *         provider: 'email'
 *       }
 *     }),
 *     
 *     resendConfirmationEmail: createMockMutation(),
 *     socialLogin: createMockMutation(),
 *     
 *     // Utility functions
 *     refetchUser: vi.fn().mockResolvedValue(null),
 *     loginWithGoogle: vi.fn(),
 *     loginWithFacebook: vi.fn(),
 *   }))
 * }))
 */ 