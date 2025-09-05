import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useNotifications } from '../hooks/useNotifications.ts'
import { BusinessSetup } from '../components/BusinessSetup.tsx'
import { useEffect } from 'react'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

function SetupPage() {
  const { user } = useAuth()
  const notifications = useNotifications()
  const navigate = useNavigate()

  // Si el usuario ya tiene un negocio configurado, redirigir al dashboard
  useEffect(() => {
    if (user?.businessId) {
      navigate({ to: '/dashboard' })
    }
  }, [user?.businessId, navigate])

  // Si no hay usuario autenticado, redirigir al login
  useEffect(() => {
    if (user === null) {
      navigate({ to: '/auth' })
    }
  }, [user, navigate])

  // Mostrar loading mientras se verifica el estado del usuario
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuración...</p>
        </div>
      </div>
    )
  }

  // Si el usuario no está autenticado o ya tiene negocio, no mostrar nada
  // (las redirecciones se manejan en los useEffect)
  if (!user || user.businessId) {
    return null
  }

  return (
    <ProtectedRoute>
      <BusinessSetup 
        isFullPage={true}
        onBusinessSetup={(_businessId: string) => {
          notifications.success('¡Negocio configurado exitosamente! Redirigiendo al dashboard...')
          
          // Pequeño delay para mostrar el mensaje de éxito
          setTimeout(() => {
            navigate({ to: '/dashboard' })
          }, 1500)
        }}
      />
    </ProtectedRoute>
  )
}
