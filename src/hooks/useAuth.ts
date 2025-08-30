/**
 * Enhanced authentication hook with OAuth support
 * 
 * @description Provides both traditional email/password authentication and OAuth (Google/Facebook)
 * via Supabase. Maintains backward compatibility while adding modern OAuth features.
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, loginWithGoogle } = useAuth()
 * 
 * // Traditional login
 * await login.mutateAsync({ email: 'user@example.com', password: 'password' })
 * 
 * // OAuth login
 * loginWithGoogle()
 * ```
 */

import { useEffect, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { 
  AuthHookReturn, 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials,
  LoginResponse,
  RegistrationResponse
} from '../types/auth.ts'
import { AuthService } from '../services/auth-service.ts'
import { useAuthToken } from './useStorageSync.ts'

// ✅ SINGLETON: Prevent multiple auth state listeners
let authStateListenerInitialized = false
let authStateSubscription: (() => void) | null = null

/**
 * Main authentication hook
 * Returns mutation objects with all expected properties (mutate, mutateAsync, isPending, etc.)
 */
export function useAuth(): AuthHookReturn {
  const queryClient = useQueryClient()
  const hasInitializedListener = useRef(false)
  
  // Use secure storage sync for auth token
  const { value: _authToken, setValue: setAuthToken, isLoading: isTokenLoading } = useAuthToken()

  /**
   * Query to get current user profile
   * Uses the new getCurrentUser method for better consistency
   */
  const { 
    data: user, 
    isLoading: isUserLoading, 
    refetch 
  } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<AuthUser | null> => {
      return await AuthService.getCurrentUser()
    },
    enabled: !isTokenLoading, // Wait for token to load from storage
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  /**
   * Refetch user function for backward compatibility
   */
  const refetchUser = useCallback(async () => {
    const result = await refetch()
    return result.data || null
  }, [refetch])

  /**
   * Traditional login mutation
   */
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      return await AuthService.login(credentials)
    },
    onSuccess: (response) => {
      // Store auth token
      setAuthToken(response.session.access_token)
      
      // CRITICAL: Set user data immediately and then invalidate
      const userData = {
        ...response.user,
        provider: 'email' as const
      }
      
      queryClient.setQueryData(['auth-user'], userData)
      
      // Wait a bit then refetch to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      }, 100)
      
      console.log('✅ Login successful, user state updated')
    },
    onError: (error) => {
      console.error('❌ Login failed:', error)
      setAuthToken(null)
      localStorage.removeItem('authToken')
    }
  })

  /**
   * Registration mutation
   */
  const register = useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<RegistrationResponse> => {
      return await AuthService.register(credentials)
    },
    onSuccess: (response) => {
      // Set user data immediately (registration doesn't return session)
      const userData = {
        ...response.user,
        provider: 'email' as const
      }
      
      queryClient.setQueryData(['auth-user'], userData)
      
      console.log('✅ Registration successful, user state updated')
    },
    onError: (error) => {
      console.error('❌ Registration failed:', error)
      setAuthToken(null)
      localStorage.removeItem('authToken')
    }
  })

  /**
   * Logout mutation
   */
  const logout = useMutation({
    mutationFn: async () => {
      return await AuthService.logout()
    },
    onSuccess: () => {
      // Clear auth token
      setAuthToken(null)
      localStorage.removeItem('authToken')
      
      // Clear user data
      queryClient.setQueryData(['auth-user'], null)
      
      console.log('✅ Logout successful, user state cleared')
    },
    onError: (error) => {
      console.error('❌ Logout failed:', error)
      // Still clear local state even if server logout fails
      setAuthToken(null)
      localStorage.removeItem('authToken')
      queryClient.setQueryData(['auth-user'], null)
    }
  })

  /**
   * Resend confirmation email mutation
   */
  const resendConfirmationEmail = useMutation({
    mutationFn: async (email: string) => {
      await AuthService.resendConfirmationEmail(email)
    },
    onError: (error) => {
      console.error('❌ Resend confirmation email failed:', error)
    }
  })

  /**
   * Change email mutation
   */
  const changeEmail = useMutation({
    mutationFn: async ({ currentEmail, newEmail }: { currentEmail: string; newEmail: string }) => {
      return await AuthService.changeEmail(currentEmail, newEmail)
    },
    onSuccess: () => {
      // Invalidate user data to refetch with new email
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    },
    onError: (error) => {
      console.error('❌ Change email failed:', error)
    }
  })

  /**
   * OAuth login methods
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      // El modal maneja toda la UX, aquí solo iniciamos el redirect
      await AuthService.socialLogin({
        provider: 'google',
        redirectTo: `${globalThis.location?.origin || import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback?source=modal`
      })
      // El usuario será redirigido, no necesitamos manejar más estado
    } catch (error) {
      console.error('❌ Google login failed:', error)
      throw error
    }
  }, [])

  const loginWithFacebook = useCallback(async () => {
    try {
      await AuthService.socialLogin({
        provider: 'facebook',
        redirectTo: `${globalThis.location?.origin || import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback?source=modal`
      })
    } catch (error) {
      console.error('❌ Facebook login failed:', error)
      throw error
    }
  }, [])

  /**
   * Listen for OAuth state changes - SINGLETON PATTERN
   */
  useEffect(() => {
    // ✅ CRITICAL: Only initialize listener once across all components
    if (authStateListenerInitialized || hasInitializedListener.current) {
      return
    }

    console.log('👂 Initializing SINGLE auth state listener...')
    authStateListenerInitialized = true
    hasInitializedListener.current = true

    // ✅ OPTIMIZADO: Solo invalidar queries, no manejar navegación
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ OAuth sign in detected in useAuth')
          // Solo invalidar, el auth callback maneja la navegación
          queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ OAuth sign out detected in useAuth')
          queryClient.setQueryData(['auth-user'], null)
        }
      }
    )

    authStateSubscription = () => subscription.unsubscribe()

    return () => {
      // Only cleanup if this is the component that initialized the listener
      if (hasInitializedListener.current) {
        console.log('🧹 Cleaning up SINGLE auth state listener...')
        authStateListenerInitialized = false
        hasInitializedListener.current = false
        if (authStateSubscription) {
          authStateSubscription()
          authStateSubscription = null
        }
      }
    }
  }, [queryClient])

  // Computed values
  const isLoading = isTokenLoading || isUserLoading
  const isAuthenticated = Boolean(user)
  const provider = user?.provider || 'email'

  /**
   * Return object with all expected properties for backward compatibility
   * This matches the AuthHookReturn interface and provides access to both
   * mutation objects (with mutate, isPending, etc.) and simple async functions
   */
  return {
    // State
    user: user || null,
    isAuthenticated,
    isLoading,
    provider,
    
    // Mutation objects (with all TanStack Query properties)
    login,
    register, 
    logout,
    resendConfirmationEmail,
    changeEmail,
    
    // Utility functions
    refetchUser,
    
    // OAuth methods
    loginWithGoogle,
    loginWithFacebook,
    
    // Loading states (extracted from mutations for convenience)
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending,
  }
} 