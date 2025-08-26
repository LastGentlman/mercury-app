import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { AuthService } from '../services/auth-service.ts'
import type { AuthUser } from '../types/auth.ts'

interface ModalContext {
  returnTo: string
  timestamp: number
  provider: 'google' | 'facebook'
  source: 'modal'
}

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

// Función de polling inteligente mejorada
async function pollForSession(
  refetchUser: () => Promise<AuthUser | null>, 
  maxAttempts = 8, 
  initialInterval = 200
) {
  console.log('🔄 Iniciando polling inteligente...')
    
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt + 1}/${maxAttempts}`)
        
      const user = await refetchUser()
      if (user) {
        console.log(`✅ Sesión encontrada en intento ${attempt + 1}`)
        return user
      }
        
      // Exponential backoff: 200ms, 300ms, 450ms, 675ms, 1012ms, 1518ms...
      const delay = Math.min(
        initialInterval * Math.pow(1.5, attempt), 
        1500 // Cap máximo de 1.5 segundos
      )
        
      console.log(`⏱️ Esperando ${delay}ms antes del siguiente intento...`)
      await new Promise(resolve => setTimeout(resolve, delay))
        
    } catch (error) {
      console.warn(`⚠️ Intento ${attempt + 1} fallido:`, error)
        
      // En los primeros intentos, los errores son normales
      if (attempt < 3) {
        continue
      }
        
      // Después del intento 3, ser más cuidadoso
      if (error instanceof Error && error.message.includes('network')) {
        console.error('❌ Error de red persistente')
        throw new Error('Error de conexión durante la autenticación')
      }
    }
  }
    
  console.error('❌ Polling agotado después de todos los intentos')
  throw new Error('Tiempo de espera agotado durante la autenticación')
}

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { refetchUser } = useAuth()
  const [loadingPhase, setLoadingPhase] = useState<'checking' | 'authenticating' | 'redirecting'>('checking')
  const [progress, setProgress] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ModalContext | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProgress(20)
        console.log('🔄 Procesando callback de OAuth...')
          
        // Detectar si viene del modal
        const urlParams = new URLSearchParams(globalThis.location.search)
        const source = urlParams.get('source')
        const isFromModal = source === 'modal'
          
        // Obtener contexto del modal si existe
        if (isFromModal) {
          const modalContext = AuthService.getModalContext()
          if (modalContext) {
            setContext(modalContext)
            console.log('📋 Contexto del modal recuperado:', modalContext)
          }
        }
          
        setProgress(30)
          
        // Verificar si ya tenemos una sesión activa (fast path)
        const immediateUser = await AuthService.getCurrentUser()
        if (immediateUser) {
          setProgress(70)
          console.log('⚡ Fast path: usuario ya autenticado')
            
          // Limpiar contexto del modal
          if (isFromModal) {
            AuthService.clearModalContext()
          }
            
          setProgress(100)
          setLoadingPhase('redirecting')
            
          // Determinar a dónde redirigir
          const returnTo = context?.returnTo || '/dashboard'
            
          setTimeout(() => {
            console.log(`🎯 Redirigiendo a: ${returnTo}`)
            navigate({ to: returnTo })
          }, 500)
            
          return
        }
          
        setLoadingPhase('authenticating')
        setProgress(50)
        console.log('🔄 Iniciando polling inteligente...')
          
        // Smart polling con exponential backoff
        const user = await pollForSession(refetchUser)
          
        setProgress(90)
        console.log('✅ Polling completado')
          
        if (user) {
          console.log('✅ Usuario autenticado via OAuth:', {
            email: (user as { email: string }).email,
            name: (user as { name: string }).name,
            provider: (user as { provider: string }).provider
          })
            
          // Limpiar contexto del modal
          if (isFromModal) {
            AuthService.clearModalContext()
          }
            
          setProgress(100)
          setLoadingPhase('redirecting')
            
          // Mensaje de bienvenida
          const userName = (user as { name: string }).name || (user as { email: string }).email
          console.log(`🎉 Bienvenido, ${userName}!`)
            
          // Redirigir después de un breve delay para mostrar éxito
          setTimeout(() => {
            const returnTo = context?.returnTo || '/dashboard'
            console.log(`🎯 Redirigiendo a: ${returnTo}`)
            navigate({ to: returnTo })
          }, 800)
            
        } else {
          throw new Error('No se pudo obtener la información del usuario después de la autenticación')
        }
          
      } catch (error: unknown) {
        console.error('❌ Error en callback de OAuth:', error)
          
        // Limpiar contexto en caso de error
        if (AuthService.getModalContext()) {
          AuthService.clearModalContext()
        }
          
        // Mensajes de error más amigables
        let errorMessage = 'Error durante la autenticación.'
        const errorMessageStr = error instanceof Error ? error.message : String(error)
        if (errorMessageStr.includes('timeout')) {
          errorMessage = 'La autenticación está tomando más tiempo del esperado. Por favor, inténtalo de nuevo.'
        } else if (errorMessageStr.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
        } else if (errorMessageStr.includes('canceled')) {
          errorMessage = 'La autenticación fue cancelada. Puedes intentar de nuevo.'
        } else if (errorMessageStr.includes('denied')) {
          errorMessage = 'Los permisos fueron denegados. Por favor, acepta los permisos necesarios.'
        }
          
        setError(errorMessage)
          
        // Redirigir a login con error después de 4 segundos
        setTimeout(() => {
          navigate({ 
            to: '/auth', 
            search: { error: errorMessage } 
          })
        }, 4000)
      }
    }

    handleCallback()
  }, [navigate, refetchUser])

  // UI de error mejorada
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
            
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>💡 Sugerencia:</strong> Si el problema persiste, intenta:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Limpiar cookies del navegador</li>
                  <li>Intentar en modo incógnito</li>
                  <li>Verificar tu conexión a internet</li>
                </ul>
              </div>
            </div>
          </div>
            
          <p className="text-sm text-gray-500">Serás redirigido al login en unos momentos...</p>
            
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/auth' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // UI de loading mejorada con contexto del modal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          
        {/* Indicador del contexto si viene del modal */}
        {context && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Completando autenticación con <strong>{context.provider}</strong>
            </p>
          </div>
        )}

        {/* Logo animado con contexto */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          {loadingPhase === 'checking' && (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
          {loadingPhase === 'authenticating' && (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          )}
          {loadingPhase === 'redirecting' && (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
        </div>

        {/* Progress Bar mejorada */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              loadingPhase === 'redirecting' ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase Messages con contexto */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {loadingPhase === 'checking' && '🔍 Verificando autenticación...'}
          {loadingPhase === 'authenticating' && '🔐 Completando login...'}
          {loadingPhase === 'redirecting' && '🎉 ¡Éxito! Redirigiendo...'}
        </h2>

        <p className="text-gray-600 mb-4">
          {loadingPhase === 'checking' && 'Procesando tu información de login'}
          {loadingPhase === 'authenticating' && 'Configurando tu sesión segura'}
          {loadingPhase === 'redirecting' && (
            context?.returnTo && context.returnTo !== '/dashboard' 
              ? `Te llevamos de vuelta a donde estabas` 
              : 'Te llevamos a tu dashboard'
          )}
        </p>

        <div className="text-xs text-gray-500 mb-6">
          {progress}% completado
        </div>

        {/* Tips según la fase */}
        {loadingPhase === 'authenticating' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-left">
            <p className="text-sm text-blue-700">
              <strong>💡 Procesando:</strong> Estamos sincronizando tu información de forma segura
            </p>
          </div>
        )}
          
        {loadingPhase === 'redirecting' && context && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 text-left">
            <p className="text-sm text-green-700">
              <strong>✅ Autenticación exitosa con {context.provider}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AuthCallbackPage() {
  return <AuthCallback />
} 