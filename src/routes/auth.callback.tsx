import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { useNotifications } from '../hooks/useNotifications.ts'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

// Smart polling with exponential backoff
async function pollForSession(
  refetchUser: () => Promise<unknown>,
  maxAttempts: number = 8,
  initialInterval: number = 200
): Promise<unknown> {
  console.log('🔄 Starting smart session polling...')
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const user = await refetchUser()
      if (user) {
        console.log(`✅ Session found after ${attempt + 1} attempts`)
        return user
      }
      
      // Exponential backoff: 200ms, 300ms, 450ms, 675ms, 1012ms, 1518ms...
      const delay = initialInterval * Math.pow(1.5, attempt)
      console.log(`⏳ Attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    } catch (error) {
      console.error(`❌ Error during attempt ${attempt + 1}:`, error)
      // Continue trying even if individual attempts fail
    }
  }
  
  throw new Error('Session polling timeout - user not found after maximum attempts')
}

// Performance tracking utility
function createPerformanceTracker() {
  const start = Date.now()
  return {
    getElapsed: () => Date.now() - start,
    log: (phase: string) => {
      const elapsed = Date.now() - start
      console.log(`⏱️ ${phase}: ${elapsed}ms`)
      return elapsed
    }
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const { refetchUser } = useAuth()
  const [loadingPhase, setLoadingPhase] = useState<'processing' | 'authenticating' | 'redirecting'>('processing')
  const [progress, setProgress] = useState(0)
  
  // Detectar si estamos en un popup
  const isPopup = globalThis.opener && globalThis.opener !== globalThis.window

  // Fallback para cerrar popup después de un tiempo
  useEffect(() => {
    if (isPopup) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout: cerrando popup automáticamente...')
        globalThis.close()
      }, 10000) // 10 segundos
      
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [isPopup])

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const tracker = createPerformanceTracker()
      
      try {
        console.log('🔄 Procesando callback de OAuth...')
        console.log('URL actual:', globalThis.location?.href)
        console.log('URL hash:', globalThis.location?.hash)
        console.log('URL search:', globalThis.location?.search)
        
        setLoadingPhase('processing')
        setProgress(25)
        tracker.log('OAuth callback processing started')
        
        // Quick initial check (no delay) - Supabase might have already processed
        console.log('🔄 Checking for immediate session...')
        const immediateUser = await refetchUser()
        
        if (immediateUser) {
          console.log('✅ Immediate session found - fast path!')
          setProgress(100)
          tracker.log('Fast path authentication completed')
          
          if (isPopup) {
            // Enviar mensaje de éxito a la ventana principal
            console.log('🔄 Enviando mensaje de éxito desde popup...')
            try {
              globalThis.opener?.postMessage({
                type: 'OAUTH_SUCCESS',
                user: immediateUser
              }, globalThis.location.origin)
              console.log('✅ Mensaje enviado, cerrando popup...')
            } catch (error) {
              console.warn('⚠️ Error enviando mensaje:', error)
            }
            
            // Intentar cerrar el popup con múltiples métodos
            try {
              globalThis.close()
            } catch (error) {
              console.warn('⚠️ Error cerrando popup:', error)
              // Fallback: intentar cerrar después de un delay
              setTimeout(() => {
                try {
                  globalThis.close()
                } catch (e) {
                  console.error('❌ No se pudo cerrar el popup:', e)
                }
              }, 100)
            }
            return
          } else {
            notifications.success(`¡Bienvenido, ${immediateUser.name || immediateUser.email}!`)
            setLoadingPhase('redirecting')
            navigate({ to: '/dashboard' })
            return
          }
        }
        
        setLoadingPhase('authenticating')
        setProgress(50)
        tracker.log('Starting smart polling')
        
        // Smart polling with exponential backoff
        const user = await pollForSession(refetchUser)
        
        setProgress(90)
        tracker.log('Session polling completed')
        
        if (user) {
          console.log('✅ Usuario autenticado via OAuth:', {
            email: (user as { email: string }).email,
            name: (user as { name: string }).name,
            provider: (user as { provider: string }).provider
          })
          
          const totalTime = tracker.log('Total authentication time')
          
          // Track performance metrics
          if (totalTime < 1000) {
            console.log('🚀 Fast login achieved!')
          } else if (totalTime < 2000) {
            console.log('✅ Acceptable login time')
          } else {
            console.log('⚠️ Slow login detected - investigate further')
          }
          
          setProgress(100)
          
          if (isPopup) {
            // Enviar mensaje de éxito a la ventana principal
            console.log('🔄 Enviando mensaje de éxito desde popup...')
            try {
              globalThis.opener?.postMessage({
                type: 'OAUTH_SUCCESS',
                user: user
              }, globalThis.location.origin)
              console.log('✅ Mensaje enviado, cerrando popup...')
            } catch (error) {
              console.warn('⚠️ Error enviando mensaje:', error)
            }
            
            // Intentar cerrar el popup con múltiples métodos
            try {
              globalThis.close()
            } catch (error) {
              console.warn('⚠️ Error cerrando popup:', error)
              // Fallback: intentar cerrar después de un delay
              setTimeout(() => {
                try {
                  globalThis.close()
                } catch (e) {
                  console.error('❌ No se pudo cerrar el popup:', e)
                }
              }, 100)
            }
          } else {
            notifications.success(`¡Bienvenido, ${(user as { name: string, email: string }).name || (user as { email: string }).email}!`)
            setLoadingPhase('redirecting')
            navigate({ to: '/dashboard' })
          }
        } else {
          throw new Error('Authentication failed - no user session found')
        }
        
      } catch (error) {
        console.error('❌ Error en callback de OAuth:', error)
        tracker.log('Authentication failed')
        
        // Enhanced error handling with user-friendly messages
        let errorMessage = 'Error durante la autenticación.'
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'La autenticación está tomando más tiempo del esperado. Por favor, inténtalo de nuevo.'
          } else if (error.message.includes('network')) {
            errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
          }
        }
        
        if (isPopup) {
          // Enviar mensaje de error a la ventana principal
          console.log('🔄 Enviando mensaje de error desde popup...')
          try {
            globalThis.opener?.postMessage({
              type: 'OAUTH_ERROR',
              error: errorMessage
            }, globalThis.location.origin)
            console.log('✅ Mensaje de error enviado, cerrando popup...')
          } catch (error) {
            console.warn('⚠️ Error enviando mensaje de error:', error)
          }
          
          // Intentar cerrar el popup con múltiples métodos
          try {
            globalThis.close()
          } catch (error) {
            console.warn('⚠️ Error cerrando popup:', error)
            // Fallback: intentar cerrar después de un delay
            setTimeout(() => {
              try {
                globalThis.close()
              } catch (e) {
                console.error('❌ No se pudo cerrar el popup:', e)
              }
            }, 100)
          }
        } else {
          notifications.error(errorMessage)
          setLoadingPhase('processing')
          navigate({ to: '/auth' })
        }
      }
    }

    // Execute callback handling
    handleOAuthCallback()
  }, [navigate, notifications, refetchUser])

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 25 && loadingPhase === 'processing') return prev + 1
        if (prev < 50 && loadingPhase === 'authenticating') return prev + 1
        if (prev < 90 && loadingPhase === 'redirecting') return prev + 1
        return prev
      })
    }, 50)
    
    return () => clearInterval(interval)
  }, [loadingPhase])

  const getPhaseMessage = () => {
    switch (loadingPhase) {
      case 'processing':
        return 'Procesando autenticación...'
      case 'authenticating':
        return 'Verificando credenciales...'
      case 'redirecting':
        return 'Redirigiendo...'
      default:
        return 'Completando autenticación...'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Enhanced loading animation */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs font-semibold text-blue-600">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getPhaseMessage()}
        </h2>
        
        <p className="text-gray-600 mb-6">
          Por favor espera mientras procesamos tu inicio de sesión.
        </p>
        
        {/* Phase indicators */}
        <div className="flex justify-center space-x-2 mb-4">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            loadingPhase === 'processing' ? 'bg-blue-500 animate-pulse' :
            progress > 25 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-colors ${
            loadingPhase === 'authenticating' ? 'bg-blue-500 animate-pulse' :
            progress > 50 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-colors ${
            loadingPhase === 'redirecting' ? 'bg-blue-500 animate-pulse' :
            progress > 90 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
        </div>
        
        {/* Debug info (only visible in development) */}
        {import.meta.env.DEV && (
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg max-w-sm mx-auto">
            <div>URL: {globalThis.location?.pathname}</div>
            <div>Hash: {globalThis.location?.hash ? 'Presente' : 'Ausente'}</div>
            <div>Fase: {loadingPhase}</div>
            <div>Progreso: {progress}%</div>
          </div>
        )}
      </div>
    </div>
  )
} 