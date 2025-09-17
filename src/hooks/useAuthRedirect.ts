/**
 * Custom hook for handling authentication redirects
 * Follows Single Responsibility Principle
 */

import { useEffect, useRef, useCallback } from 'react'
import { useRedirectManager } from '../utils/redirectManager.ts'

interface UseAuthRedirectOptions {
  isAuthenticated: boolean
  isLoading: boolean
  isRedirecting: boolean
  user: any
  maxAttempts?: number
  redirectDelay?: number
}

interface UseAuthRedirectReturn {
  shouldRedirect: boolean
  isRedirecting: boolean
  startRedirect: () => void
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_REDIRECT_DELAY = 100
const DASHBOARD_ROUTE = '/dashboard'

export function useAuthRedirect({
  isAuthenticated,
  isLoading,
  isRedirecting,
  user,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  redirectDelay = DEFAULT_REDIRECT_DELAY
}: UseAuthRedirectOptions): UseAuthRedirectReturn {
  const redirectAttemptsRef = useRef(0)
  const { isRedirectInProgress, startRedirect: startRedirectManager, completeRedirect } = useRedirectManager()

  const isOAuthCallback = useCallback(() => {
    const pathname = globalThis.location?.pathname
    return pathname === '/auth/callback' || pathname?.includes('/auth/callback')
  }, [])

  const shouldRedirect = useCallback(() => {
    // Don't redirect if account deletion is in progress
    if (typeof window !== 'undefined' && (window as any).__ACCOUNT_DELETION_IN_PROGRESS__) {
      return false
    }
    
    // 🚨 EMERGENCY FIX: Add additional checks to prevent infinite loops
    const currentPath = globalThis.location?.pathname
    const isOnAuthPage = currentPath === '/auth' || currentPath?.startsWith('/auth')
    
    // Don't redirect if we're already on auth page to prevent loops
    if (isOnAuthPage) {
      console.log('🚨 Preventing redirect from auth page to prevent infinite loop')
      return false
    }
    
    return isAuthenticated && 
           !isRedirecting && 
           !isLoading && 
           !isRedirectInProgress() && 
           !isOAuthCallback()
  }, [isAuthenticated, isRedirecting, isLoading, isRedirectInProgress, isOAuthCallback])

  const performRedirect = useCallback(() => {
    if (redirectAttemptsRef.current >= maxAttempts) {
      console.error('Max redirect attempts reached')
      return
    }

    redirectAttemptsRef.current++
    
    if (startRedirectManager(5000)) {
      const redirectTimer = setTimeout(() => {
        try {
          window.location.href = DASHBOARD_ROUTE
          completeRedirect()
        } catch (error) {
          console.error('Redirect failed:', error)
        }
      }, redirectDelay)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [maxAttempts, startRedirectManager, completeRedirect, redirectDelay])

  useEffect(() => {
    if (shouldRedirect()) {
      performRedirect()
    }
  }, [shouldRedirect, performRedirect])

  return {
    shouldRedirect: shouldRedirect(),
    isRedirecting,
    startRedirect: performRedirect
  }
}
