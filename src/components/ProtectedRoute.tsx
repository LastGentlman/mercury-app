import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth.ts'
import { Loader2 } from 'lucide-react'
import { useRedirectManager } from '../utils/redirectManager.ts'
import { useAccountValidation } from '../middleware/account-validation.ts'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const navigate = useNavigate()
  const { isRedirectInProgress, startRedirect, completeRedirect } = useRedirectManager()
  const { validateAccount, handleValidationResult } = useAccountValidation()
  const [isValidatingAccount, setIsValidatingAccount] = useState(false)

  // ✅ Account validation effect - RE-ENABLED WITH IMPROVED ERROR HANDLING
  useEffect(() => {
    const validateUserAccount = async () => {
      if (!isLoading && isAuthenticated && user && !isValidatingAccount) {
        setIsValidatingAccount(true)
        
        try {
          const currentPath = globalThis.location?.pathname || '/'
          console.log('🔍 Starting account validation for:', { userId: user.id, path: currentPath })
          
          const validationResult = await validateAccount(user, currentPath)
          
          console.log('🔍 Account validation result:', validationResult)
          
          if (validationResult.shouldRedirect) {
            handleValidationResult(
              validationResult,
              (path: string) => {
                console.log('🔄 Redirecting due to account validation:', path)
                navigate({ to: path, replace: true })
              },
              () => {
                console.log('🚪 Force logout due to account deletion')
                logout.mutate()
              }
            )
          }
        } catch (error) {
          console.error('Error validating account:', error)
          // On error, allow access but log the issue - this prevents blocking users
          console.log('⚠️ Account validation failed, allowing access to prevent blocking user')
        } finally {
          setIsValidatingAccount(false)
        }
      }
    }

    validateUserAccount()
  }, [isAuthenticated, isLoading, user, isValidatingAccount, validateAccount, handleValidationResult, navigate, logout])

  // ✅ FIX: More robust redirect logic with better conditions
  useEffect(() => {
    console.log('🔍 ProtectedRoute useEffect triggered:', {
      isLoading,
      isAuthenticated,
      isRedirectInProgress: isRedirectInProgress(),
      currentPath: globalThis.location?.pathname,
      isValidatingAccount
    })

    // Check if we're coming from OAuth callback (give more time for auth to establish)
    const isFromOAuthCallback = globalThis.location?.search?.includes('source=') || 
                               globalThis.location?.hash?.includes('access_token') ||
                               globalThis.location?.search?.includes('access_token')

    // Only redirect if we're sure the user is not authenticated and not loading
    // Add extra delay if coming from OAuth callback
    if (!isLoading && !isAuthenticated && !isRedirectInProgress() && !isValidatingAccount) {
      console.log('🔒 ProtectedRoute: User not authenticated, redirecting to auth...', {
        isFromOAuthCallback,
        willDelay: isFromOAuthCallback
      })
      
      if (startRedirect(3000)) {
        // Use longer delay if coming from OAuth callback to allow auth to establish
        const delay = isFromOAuthCallback ? 2000 : 50
        setTimeout(() => {
          navigate({ to: '/auth', replace: true })
          completeRedirect()
        }, delay)
      }
    } else {
      console.log('⏳ ProtectedRoute: Skipping redirect - loading, authenticated, redirect in progress, or validating account')
    }
  }, [isAuthenticated, isLoading, navigate, isRedirectInProgress, startRedirect, completeRedirect, isValidatingAccount])

  if (isLoading || isValidatingAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">
            {isValidatingAccount ? 'Validando cuenta...' : 'Loading...'}
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to auth page
  }

  return <>{children}</>
} 