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
import { useOfflineAuth } from './useOfflineAuth.ts'

/**
 * Main authentication hook
 * Returns mutation objects with all expected properties (mutate, mutateAsync, isPending, etc.)
 */
export function useAuth(): AuthHookReturn {
  const queryClient = useQueryClient()
  
  // ✅ Exponer queryClient globalmente para que los servicios puedan invalidar queries
  if (typeof window !== 'undefined') {
    (window as any).queryClient = queryClient;
  }
  
  // Use secure storage sync for auth token
  const { value: _authToken, setValue: setAuthToken, isLoading: isTokenLoading } = useAuthToken()
  
  // ✅ Integrar sistema de autenticación offline
  const { actions: offlineActions } = useOfflineAuth()

  /**
   * Query to get current user profile
   * Uses the new getCurrentUser method for better consistency
   * ✅ Enhanced with offline authentication verification
   */
  const { 
    data: user, 
    isLoading: isUserLoading, 
    refetch 
  } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<AuthUser | null> => {
      // ✅ Verificar token con sistema offline antes de obtener usuario
      const token = localStorage.getItem('authToken')
      if (token) {
        const verification = await offlineActions.verifyToken(token)
        if (!verification.valid) {
          console.log('❌ Token invalid during user fetch:', verification.reason)
          // Limpiar token inválido
          setAuthToken(null)
          localStorage.removeItem('authToken')
          return null
        }
      }
      
      return await AuthService.getCurrentUser()
    },
    enabled: !isTokenLoading, // Wait for token to load from storage
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced for faster updates)
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always refetch on mount for fresh data
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
    onSuccess: (response: LoginResponse) => {
      console.log('✅ Login successful, response:', response)
      // Store auth token
      setAuthToken(response.session.access_token)
      
      // CRITICAL: Set user data immediately and then invalidate
      const userData = {
        ...response.user,
        provider: 'email' as const
      }
      
      queryClient.setQueryData(['auth-user'], userData)
      
      // Invalidate immediately for consistency - no artificial delay
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      
      console.log('✅ Login successful, user state updated')
    },
    onError: (error: unknown) => {
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
    onSuccess: (response: RegistrationResponse) => {
      // Store auth token if no email confirmation required
      if (!response.emailConfirmationRequired && response.user) {
        queryClient.setQueryData(['auth-user'], response.user)
      }
      
      console.log('✅ Registration successful')
    },
    onError: (error: unknown) => {
      console.error('❌ Registration failed:', error)
    }
  })

  /**
   * Logout mutation
   * ✅ Enhanced with offline authentication cleanup
   */
  const logout = useMutation({
    mutationFn: async (): Promise<void> => {
      await AuthService.logout()
    },
    onSuccess: () => {
      // ✅ Clear offline authentication data
      offlineActions.clearOfflineData()
      
      // Clear auth state
      setAuthToken(null)
      queryClient.setQueryData(['auth-user'], null)
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      
      // Also clear localStorage directly for immediate effect
      localStorage.removeItem('authToken')
      
      // 🔒 SECURITY: Redirect to auth page immediately
      window.location.href = '/auth'
      
      console.log('✅ Logout successful, redirected to auth page')
    },
    onError: (error: unknown) => {
      console.error('❌ Logout failed:', error)
      // ✅ Clear offline authentication data even on error
      offlineActions.clearOfflineData()
      
      // Even if logout fails on server, clear local state
      setAuthToken(null)
      queryClient.setQueryData(['auth-user'], null)
      localStorage.removeItem('authToken')
      
      // 🔒 SECURITY: Redirect to auth page even on error
      window.location.href = '/auth'
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
    onError: (error: unknown) => {
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
    onSuccess: (data: { newEmail: string }) => {
      console.log('✅ Email changed successfully:', data.newEmail)
    },
    onError: (error: unknown) => {
      console.error('❌ Failed to change email:', error)
    }
  })

  /**
   * Change password mutation
   */
  const changePassword = useMutation({
    mutationFn: async ({ 
      currentPassword, 
      newPassword, 
      confirmPassword 
    }: { 
      currentPassword: string
      newPassword: string
      confirmPassword: string
    }): Promise<{ message: string }> => {
      return await AuthService.changePassword({ currentPassword, newPassword, confirmPassword })
    },
    onSuccess: (data: { message: string }) => {
      console.log('✅ Password changed successfully:', data.message)
      // Clear user data and redirect to login
      queryClient.clear()
      window.location.href = '/auth'
    },
    onError: (error: unknown) => {
      console.error('❌ Failed to change password:', error)
    }
  })

  /**
   * OAuth methods simplificados - SIN manejo de popups
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      // El modal maneja toda la UX, aquí solo iniciamos el redirect
      await AuthService.socialLogin({
        provider: 'google',
        redirectTo: `${globalThis.location?.origin || (import.meta as any)?.env?.VITE_APP_URL || 'http://localhost:3000'}/auth/callback?source=modal`
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
        redirectTo: `${globalThis.location?.origin || (import.meta as any)?.env?.VITE_APP_URL || 'http://localhost:3000'}/auth/callback?source=modal`
      })
    } catch (error) {
      console.error('❌ Facebook login failed:', error)
      throw error
    }
  }, [])

  /**
   * Listen for OAuth state changes with improved loop prevention
   */
  const lastEventTimeRef = useRef(0)
  
  useEffect(() => {
    const eventThrottle = 2000 // 2 seconds throttle
    
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        const now = Date.now()
        
        // Throttle events to prevent rapid fire
        if (now - lastEventTimeRef.current < eventThrottle) {
          console.log(`⏳ OAuth event throttled: ${event}`)
          return
        }
        lastEventTimeRef.current = now
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ OAuth sign in detected')
          // ✅ FIX: Only invalidate if we don't already have user data to prevent infinite loop
          const currentUser = queryClient.getQueryData(['auth-user'])
          if (!currentUser) {
            console.log('🔄 Invalidating auth-user query due to OAuth sign in')
            queryClient.invalidateQueries({ queryKey: ['auth-user'] })
          } else {
            console.log('ℹ️ User data already exists, skipping query invalidation')
          }
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

    globalThis.addEventListener('oauth-success', handleOAuthSuccess as EventListener)
    globalThis.addEventListener('oauth-error', handleOAuthError as EventListener)

    return () => {
      subscription.unsubscribe()
      globalThis.removeEventListener('oauth-success', handleOAuthSuccess as EventListener)
      globalThis.removeEventListener('oauth-error', handleOAuthError as EventListener)
    }
  }, [queryClient])



  /**
   * Return object with all expected properties for backward compatibility
   * This matches the AuthHookReturn interface and provides access to both
   * mutation objects (with mutate, isPending, etc.) and simple async functions
   */
  return {
    // State
    user: user || null,
    isAuthenticated: !!user,
    isLoading: isUserLoading || isTokenLoading,
    provider: user?.provider || 'email',
    
    // Mutations
    login,
    register,
    logout,
    resendConfirmationEmail,
    changeEmail,
    changePassword,
    
    // Utility functions
    refetchUser,
    
    // OAuth methods
    loginWithGoogle,
    loginWithFacebook,
    
    // Loading states (convenience accessors)
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending
  }
} 