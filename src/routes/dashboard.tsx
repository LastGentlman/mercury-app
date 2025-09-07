import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { Dashboard } from '../components/Dashboard.tsx'
import { useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Si no hay businessId, redirigir a la página de configuración
  useEffect(() => {
    if (user && !user.businessId) {
      navigate({ to: '/setup' })
    }
  }, [user, navigate])

  // Si no hay usuario autenticado, redirigir al login
  useEffect(() => {
    // Only redirect if user is explicitly null (not undefined/loading)
    if (user === null) {
      console.log('❌ No user found, redirecting to auth...')
      navigate({ to: '/auth', replace: true })
    }
  }, [user, navigate])

  // Mostrar loading mientras se verifica el estado del usuario
  if (user === undefined) {
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
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard businessId={user.businessId} />
        </main>
      </div>
    </ProtectedRoute>
  )
} 