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

import { useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { 
  AuthHookReturn, 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials,
  SocialLoginOptions,
  LoginResponse,
  RegistrationResponse
} from '../types/auth.ts'
import { AuthService } from '../services/auth-service.ts'
import { useAuthToken } from './useStorageSync.ts'

/**
 * Main authentication hook
 * Returns mutation objects with all expected properties (mutate, mutateAsync, isPending, etc.)
 */
export function useAuth(): AuthHookReturn {
  const queryClient = useQueryClient()
  
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
      // Store auth token if no email confirmation required
      if (!response.emailConfirmationRequired && response.user) {
        queryClient.setQueryData(['auth-user'], response.user)
      }
      
      console.log('✅ Registration successful')
    },
    onError: (error) => {
      console.error('❌ Registration failed:', error)
    }
  })

  /**
   * Logout mutation
   */
  const logout = useMutation({
    mutationFn: async (): Promise<void> => {
      await AuthService.logout()
    },
    onSuccess: () => {
      // Clear auth state
      setAuthToken(null)
      queryClient.setQueryData(['auth-user'], null)
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      
      // Also clear localStorage directly for immediate effect
      localStorage.removeItem('authToken')
      
      // 🔒 SECURITY: Redirect to auth page immediately
      globalThis.location.href = '/auth'
      
      console.log('✅ Logout successful, redirected to auth page')
    },
    onError: (error) => {
      console.error('❌ Logout failed:', error)
      // Even if logout fails on server, clear local state
      setAuthToken(null)
      queryClient.setQueryData(['auth-user'], null)
      localStorage.removeItem('authToken')
      
      // 🔒 SECURITY: Redirect to auth page even on error
      globalThis.location.href = '/auth'
    }
  })

  /**
   * Resend confirmation email mutation
   */
  const resendConfirmationEmail = useMutation({
    mutationFn: async (email: string): Promise<void> => {
      await AuthService.resendConfirmationEmail(email)
    },
    onSuccess: () => {
      console.log('✅ Confirmation email sent')
    },
    onError: (error) => {
      console.error('❌ Failed to resend confirmation email:', error)
    }
  })

  /**
   * Change email mutation
   */
  const changeEmail = useMutation({
    mutationFn: async ({ currentEmail, newEmail }: { currentEmail: string; newEmail: string }): Promise<{ newEmail: string }> => {
      return await AuthService.changeEmail(currentEmail, newEmail)
    },
    onSuccess: (data) => {
      console.log('✅ Email changed successfully:', data.newEmail)
    },
    onError: (error) => {
      console.error('❌ Failed to change email:', error)
    }
  })

  /**
   * Social login mutation (for OAuth via Supabase)
   */
  const socialLogin = useMutation({
    mutationFn: async (options: SocialLoginOptions) => {
      await AuthService.socialLogin(options)
      // Note: The actual auth happens via redirect, so this just initiates the flow
    },
    onError: (error) => {
      console.error('❌ Social login failed:', error)
    }
  })

  /**
   * Google login shortcut
   */
  const loginWithGoogle = useCallback(() => {
    socialLogin.mutate({ 
      provider: 'google',
      redirectTo: `${globalThis.location?.origin || import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`
    })
  }, [socialLogin])

  /**
   * Facebook login shortcut
   */
  const loginWithFacebook = useCallback(() => {
    socialLogin.mutate({ 
      provider: 'facebook',
      redirectTo: `${globalThis.location?.origin || import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`
    })
  }, [socialLogin])

  /**
   * Listen for OAuth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ OAuth sign in detected')
          queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ OAuth sign out detected')
          queryClient.setQueryData(['auth-user'], null)
        }
      }
    )

    // Escuchar eventos personalizados de OAuth popup
    const handleOAuthSuccess = (event: CustomEvent) => {
      console.log('✅ OAuth success event received:', event.detail)
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    }

    const handleOAuthError = (event: CustomEvent) => {
      console.error('❌ OAuth error event received:', event.detail)
      // Aquí podrías mostrar una notificación de error si es necesario
    }

    window.addEventListener('oauth-success', handleOAuthSuccess as EventListener)
    window.addEventListener('oauth-error', handleOAuthError as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('oauth-success', handleOAuthSuccess as EventListener)
      window.removeEventListener('oauth-error', handleOAuthError as EventListener)
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
    socialLogin,
    
    // Utility functions
    refetchUser,
    
    // OAuth methods
    loginWithGoogle,
    loginWithFacebook,
    
    // Loading states (extracted from mutations for convenience)
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending,
    isSocialLoginLoading: socialLogin.isPending,
  }
} 