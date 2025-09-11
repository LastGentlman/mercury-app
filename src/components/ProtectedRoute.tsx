import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth.ts'
import { Loader2 } from 'lucide-react'
import { useRedirectManager } from '../utils/redirectManager.ts'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { isRedirectInProgress, startRedirect, completeRedirect } = useRedirectManager()

  // ✅ FIX: More robust redirect logic with better conditions
  useEffect(() => {
    console.log('🔍 ProtectedRoute useEffect triggered:', {
      isLoading,
      isAuthenticated,
      isRedirectInProgress: isRedirectInProgress(),
      currentPath: globalThis.location?.pathname
    })

    // Check if we're coming from OAuth callback (give more time for auth to establish)
    const isFromOAuthCallback = globalThis.location?.search?.includes('source=') || 
                               globalThis.location?.hash?.includes('access_token') ||
                               globalThis.location?.search?.includes('access_token')

    // Only redirect if we're sure the user is not authenticated and not loading
    // Add extra delay if coming from OAuth callback
    if (!isLoading && !isAuthenticated && !isRedirectInProgress()) {
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
      console.log('⏳ ProtectedRoute: Skipping redirect - loading, authenticated, or redirect in progress')
    }
  }, [isAuthenticated, isLoading, navigate, isRedirectInProgress, startRedirect, completeRedirect])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to auth page
  }

  return <>{children}</>
} 