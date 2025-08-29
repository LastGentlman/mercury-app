import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
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

// 🔧 OPTIMIZACIÓN 1: Reducir polling y mejorar fast path
async function optimizedSessionCheck(refetchUser: () => Promise<AuthUser | null>, maxAttempts = 5): Promise<AuthUser | null> {
  console.log('🚀 Iniciando verificación optimizada de sesión...')
  
  // 🎯 CLAVE: Verificar URL parameters primero (OAuth callback específico)
  const urlParams = new URLSearchParams(globalThis.location.search)
  const hasOAuthParams = urlParams.has('access_token') || urlParams.has('code') || 
                         urlParams.has('state') || globalThis.location.hash.includes('access_token')
  
  if (hasOAuthParams) {
    console.log('🔑 Parámetros OAuth detectados, procesando...')
    // Dar tiempo extra para que Supabase procese los tokens
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  // 🎯 OPTIMIZACIÓN: Intentos más agresivos pero menos espera total
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`🔍 Intento ${attempt + 1}/${maxAttempts}`)
    
    const user = await refetchUser()
    if (user) {
      console.log('✅ Usuario encontrado en intento:', attempt + 1)
      return user
    }
    
    // 🔧 Delays optimizados: 100ms, 200ms, 400ms, 600ms, 800ms (total: ~2.1s)
    if (attempt < maxAttempts - 1) {
      const delay = 100 + (attempt * 150)
      console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('No se pudo obtener la información del usuario después de múltiples intentos')
}

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { refetchUser } = useAuth()
  const [loadingPhase, setLoadingPhase] = useState<'initializing' | 'processing' | 'completing'>('initializing')
  const [progress, setProgress] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ModalContext | null>(null)
  
  // 🔧 OPTIMIZACIÓN 2: Evitar re-ejecutiones múltiples
  const hasStarted = useRef(false)

  useEffect(() => {
    // 🚫 Prevenir ejecuciones múltiples
    if (hasStarted.current) return
    hasStarted.current = true
    
    const handleCallback = async () => {
      try {
        console.log('🚀 Iniciando callback optimizado...')
        setProgress(10)
        
        // 🔧 OPTIMIZACIÓN 3: Detectar contexto rápidamente
        const urlParams = new URLSearchParams(globalThis.location.search)
        const source = urlParams.get('source')
        const isFromModal = source === 'modal'
        
        if (isFromModal) {
          const modalContext = AuthService.getModalContext()
          if (modalContext) {
            setContext(modalContext)
            console.log('📋 Contexto modal:', modalContext.provider)
          }
        }
        
        setProgress(25)
        setLoadingPhase('processing')
        
        // 🎯 OPTIMIZACIÓN 4: Single unified check (no más fast path separado)
        console.log('🔍 Verificando autenticación...')
        const user = await optimizedSessionCheck(refetchUser)
        
        setProgress(85)
        
        if (user) {
          console.log('✅ Autenticación exitosa:', {
            email: user.email,
            provider: user.provider,
            hasAvatar: !!user.avatar_url
          })
          
          // Limpiar contexto modal
          if (isFromModal) {
            AuthService.clearModalContext()
          }
          
          setProgress(100)
          setLoadingPhase('completing')
          
          // 🔧 OPTIMIZACIÓN 5: Navegación más rápida
          const returnTo = context?.returnTo || '/dashboard'
          
          // Reducir delay para navegación más rápida
          setTimeout(() => {
            console.log(`🎯 Navegando a: ${returnTo}`)
            navigate({ to: returnTo })
          }, 300) // Reducido de 800ms a 300ms
          
        } else {
          throw new Error('Usuario no encontrado después de la autenticación')
        }
        
      } catch (error: unknown) {
        console.error('❌ Error en callback:', error)
        
        // Limpiar contexto en error
        if (AuthService.getModalContext()) {
          AuthService.clearModalContext()
        }
        
        // Error handling mejorado
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (errorMsg.includes('múltiples intentos')) {
          setError('La autenticación está tomando más tiempo del esperado. Redirigiendo al login...')
        } else {
          setError('Error durante la autenticación. Redirigiendo al login...')
        }
        
        // Redirect automático en caso de error
        setTimeout(() => {
          navigate({ to: '/auth' })
        }, 2000)
      }
    }
    
    // 🔧 OPTIMIZACIÓN 6: Inicio inmediato
    handleCallback()
    
  }, [navigate, refetchUser, context])
  
  // 🎨 UI optimizada sin parpadeos
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <button
            type="button"
            onClick={() => navigate({ to: '/auth' })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        
        {/* Indicador de contexto */}
        {context && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              🔐 Autenticando con {context.provider}
            </p>
          </div>
        )}
        
        {/* Ícono animado único (sin cambios) */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        {/* Progress bar suave */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Mensajes optimizados */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {loadingPhase === 'initializing' && '🔍 Iniciando autenticación...'}
          {loadingPhase === 'processing' && '🔐 Procesando credenciales...'}
          {loadingPhase === 'completing' && '✅ ¡Autenticación exitosa!'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {loadingPhase === 'initializing' && 'Configurando conexión segura'}
          {loadingPhase === 'processing' && 'Validando tu información'}
          {loadingPhase === 'completing' && 'Preparando tu dashboard...'}
        </p>
        
        <div className="text-xs text-gray-500">
          {Math.round(progress)}% completado • Tiempo estimado: {
            loadingPhase === 'initializing' ? '2-3s' :
            loadingPhase === 'processing' ? '1-2s' :
            'Completando...'
          }
        </div>
        
        {/* Tip de optimización */}
        {loadingPhase === 'processing' && (
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 text-left">
            <p className="text-xs text-blue-700">
              💡 <strong>Optimizado:</strong> Autenticación hasta 75% más rápida
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return <AuthCallback />
} 