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
 * await login({ email: 'user@example.com', password: 'password' })
 * 
 * // OAuth login
 * loginWithGoogle()
 * ```
 */

import { useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthHookReturn, AuthUser } from '../types/auth'
import { AuthService } from '../services/auth-service'
import { useAuthToken } from './useStorageSync'

/**
 * Main authentication hook
 */
export function useAuth(): AuthHookReturn {
  const queryClient = useQueryClient()
  
  // Use secure storage sync for auth token
  const { value: authToken, setValue: setAuthToken, isLoading: isTokenLoading } = useAuthToken()

  /**
   * Query to get current user profile
   * Checks OAuth session first, then falls back to traditional auth
   */
  const { 
    data: user, 
    isLoading: isUserLoading, 
    refetch 
  } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<AuthUser | null> => {
      // Priority 1: Check Supabase OAuth session
      const oauthUser = await AuthService.getOAuthSession()
      if (oauthUser) {
        return oauthUser
      }

      // Priority 2: Check traditional auth token
      if (!authToken) return null
      
      const traditionalUser = await AuthService.getTraditionalProfile(authToken)
      if (!traditionalUser) {
        // Token is invalid, clear it
        setAuthToken(null)
        return null
      }

      return traditionalUser
    },
    enabled: !isTokenLoading, // Wait for token to load from storage
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  /**
   * Memoized refetch function to prevent unnecessary re-renders
   */
  const refetchUser = useCallback(async (): Promise<AuthUser | null> => {
    const result = await refetch()
    return result.data || null
  }, [refetch])

  /**
   * Social login mutation
   */
  const socialLogin = useMutation({
    mutationFn: AuthService.socialLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    },
  })

  /**
   * Traditional login mutation
   */
  const login = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      if (data.session?.access_token) {
        setAuthToken(data.session.access_token)
      }
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    },
  })

  /**
   * Registration mutation
   */
  const register = useMutation({
    mutationFn: AuthService.register,
    // Don't invalidate queries on registration - user needs to confirm email
  })

  /**
   * Logout mutation
   */
  const logout = useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      setAuthToken(null)
      queryClient.setQueryData(['auth-user'], null)
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      queryClient.clear() // Clear all cached data on logout
    },
  })

  /**
   * Resend confirmation email mutation
   */
  const resendConfirmationEmail = useMutation({
    mutationFn: AuthService.resendConfirmationEmail,
  })

  /**
   * OAuth helper functions
   */
  const loginWithGoogle = useCallback(() => {
    socialLogin.mutate({ 
      provider: 'google',
      redirectTo: `${window.location.origin}/dashboard`
    })
  }, [socialLogin])

  const loginWithFacebook = useCallback(() => {
    socialLogin.mutate({ 
      provider: 'facebook',
      redirectTo: `${window.location.origin}/dashboard`
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

    return () => subscription.unsubscribe()
  }, [queryClient])

  // Computed values
  const isLoading = isTokenLoading || isUserLoading
  const isAuthenticated = Boolean(user)
  const provider = user?.provider || 'email'

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    provider,
    
    // Methods (async versions for backward compatibility)
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    resendConfirmationEmail: resendConfirmationEmail.mutateAsync,
    refetchUser,
    
         // OAuth methods
     loginWithGoogle,
     loginWithFacebook,
     socialLogin: (options: SocialLoginOptions) => socialLogin.mutateAsync(options).then(() => {}),
    
    // Loading states
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending,
    isSocialLoginLoading: socialLogin.isPending,
  }
} 