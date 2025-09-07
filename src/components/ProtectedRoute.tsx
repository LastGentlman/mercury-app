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
    // Only redirect if we're sure the user is not authenticated and not loading
    if (!isLoading && !isAuthenticated && !isRedirectInProgress()) {
      console.log('🔒 ProtectedRoute: User not authenticated, redirecting to auth...')
      
      if (startRedirect(3000)) {
        // Use setTimeout to prevent race conditions
        setTimeout(() => {
          navigate({ to: '/auth', replace: true })
          completeRedirect()
        }, 50)
      }
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