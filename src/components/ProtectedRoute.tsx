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

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isRedirectInProgress()) {
      // 🔒 SECURITY: Use TanStack Router navigation for consistency
      startRedirect(3000) // Reduced timeout for faster response
      navigate({ to: '/auth', replace: true })
      completeRedirect()
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