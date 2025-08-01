import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export const Route = createFileRoute('/auth/callback')({
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
        console.log('URL actual:', window.location.href)
        console.log('URL hash:', window.location.hash)
        console.log('URL search:', window.location.search)
        
        // Esperar un momento para que Supabase procese la sesión desde el URL hash
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Refrescar el usuario para obtener la sesión OAuth
        console.log('🔄 Refrescando usuario...')
        const user = await refetchUser()
        
        if (user) {
          console.log('✅ Usuario autenticado via OAuth:', {
            email: user.email,
            name: user.name,
            provider: user.provider
          })
          notifications.success(`¡Bienvenido, ${user.name || user.email}!`)
          navigate({ to: '/dashboard' })
        } else {
          console.warn('⚠️ No se encontró sesión de usuario después del callback')
          console.log('Intentando una vez más en 2 segundos...')
          
          // Segundo intento después de más tiempo
          await new Promise(resolve => setTimeout(resolve, 2000))
          const userRetry = await refetchUser()
          
          if (userRetry) {
            console.log('✅ Usuario encontrado en segundo intento')
            notifications.success(`¡Bienvenido, ${userRetry.name || userRetry.email}!`)
            navigate({ to: '/dashboard' })
          } else {
            console.error('❌ No se pudo obtener usuario después de múltiples intentos')
            notifications.error('Error completando la autenticación. Inténtalo de nuevo.')
            navigate({ to: '/auth' })
          }
        }
      } catch (error) {
        console.error('❌ Error en callback de OAuth:', error)
        notifications.error('Error durante la autenticación.')
        navigate({ to: '/auth' })
      }
    }

    // Ejecutar el manejo del callback
    handleOAuthCallback()
  }, [navigate, notifications, refetchUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Completando autenticación...
        </h2>
        <p className="text-gray-600 mb-4">
          Por favor espera mientras procesamos tu inicio de sesión.
        </p>
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded max-w-md">
          <div>URL: {window.location.pathname}</div>
          <div>Hash: {window.location.hash ? 'Presente' : 'Ausente'}</div>
        </div>
      </div>
    </div>
  )
} 