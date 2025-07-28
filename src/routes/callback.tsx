import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

// @ts-ignore - TanStack Router needs to regenerate routes
export const Route = createFileRoute('/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const { refetchUser } = useAuth()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 Procesando callback de OAuth...')
        
        // Esperar un momento para que Supabase procese la sesión
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Refrescar el usuario para obtener la sesión OAuth
        const user = await refetchUser()
        
        if (user) {
          console.log('✅ Usuario autenticado via OAuth:', user.email)
          notifications.success(`¡Bienvenido, ${user.name || user.email}!`)
          navigate({ to: '/dashboard' })
        } else {
          console.warn('⚠️ No se encontró sesión de usuario después del callback')
          notifications.error('Error completando la autenticación. Inténtalo de nuevo.')
          navigate({ to: '/auth' })
        }
      } catch (error) {
        console.error('❌ Error en callback de OAuth:', error)
        notifications.error('Error durante la autenticación.')
        navigate({ to: '/auth' })
      }
    }

    handleOAuthCallback()
  }, [navigate, notifications, refetchUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Completando autenticación...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras procesamos tu inicio de sesión.
        </p>
      </div>
    </div>
  )
} 