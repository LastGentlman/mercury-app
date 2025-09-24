import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { Dashboard } from '../components/Dashboard.tsx'
import { useEffect } from 'react'
import { useRedirectManager } from '../utils/redirectManager.ts'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { isRedirectInProgress, startRedirect, completeRedirect } = useRedirectManager()

  // ✅ SIMPLIFIED: Let ProtectedRoute handle all redirects, dashboard only handles business setup
  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', {
      isLoading,
      isAuthenticated,
      user: user ? { id: user.id, email: user.email, businessId: user.businessId } : null,
      isRedirectInProgress: isRedirectInProgress()
    })

    // Only handle business setup redirect, let ProtectedRoute handle auth redirects
    if (!isLoading && !isRedirectInProgress() && isAuthenticated && user && !user.businessId) {
      console.log('🔄 Dashboard: User authenticated but no business, redirecting to setup...')
      if (startRedirect(5000)) {
        navigate({ to: '/setup' })
        completeRedirect()
      }
    }
  }, [user, isAuthenticated, isLoading, navigate, isRedirectInProgress, startRedirect, completeRedirect])

  // Mostrar loading mientras se verifica el estado del usuario
  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si el usuario no está autenticado o no tiene negocio, no mostrar nada
  // (las redirecciones se manejan en los useEffect)
  if (!user || !user.businessId) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard businessId={user.businessId} />
        </main>
      </div>
    </ProtectedRoute>
  )
} 