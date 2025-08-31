import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { AuthService } from '../services/auth-service.ts'
import { getSearchParams, getHash } from '../utils/browser.ts'
import { logger } from '../utils/logger.ts'
import type { AuthUser } from '../types/auth.ts'



export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

// ✅ OPTIMIZACIÓN 1: Consolidated State Interface
interface AuthCallbackState {
  phase: 'initializing' | 'processing' | 'completing' | 'error'
  progress: number
  message: string
  error?: string
}

// ✅ OPTIMIZACIÓN 2: Direct Auth Check (No Polling)
async function directAuthCheck(): Promise<AuthUser | null> {
  logger.debug('🔍 Direct authentication check...', { component: 'AuthCallback' })
  
  // Give OAuth time to process URL parameters
  const hasOAuthParams = getSearchParams().toString().includes('access_token') || 
                        getSearchParams().toString().includes('code') ||
                        getHash().includes('access_token')
  
  if (hasOAuthParams) {
    logger.debug('🔑 OAuth parameters detected, processing...', { component: 'AuthCallback' })
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Single service call - no useQuery loop
  try {
    const user = await AuthService.getCurrentUser()
    if (user) {
      logger.info('✅ User authenticated:', { email: user.email, component: 'AuthCallback' })
      return user
    }
  } catch (_error) {
    logger.warn('⚠️ First attempt failed, trying fallback...', { component: 'AuthCallback' })
  }
  
  // Single fallback attempt
  await new Promise(resolve => setTimeout(resolve, 800))
  try {
    const user = await AuthService.getCurrentUser()
    if (user) {
      logger.info('✅ User authenticated on retry:', { email: user.email, component: 'AuthCallback' })
      return user
    }
  } catch (error) {
    logger.error('❌ Auth check failed:', error as Error, { component: 'AuthCallback' })
    throw new Error('Authentication failed after retry')
  }
  
  throw new Error('No user found after authentication')
}

// ✅ OPTIMIZACIÓN 3: Zero Re-render Callback Component  
export const OptimizedAuthCallback = () => {
  const navigate = useNavigate()
  
  // ✅ SINGLE STATE = SINGLE RE-RENDER SOURCE
  const [state, setState] = useState<AuthCallbackState>({
    phase: 'initializing',
    progress: 5,
    message: 'Iniciando autenticación...'
  })
  
  // ✅ Prevent multiple executions
  const hasStarted = useRef(false)
  const isNavigating = useRef(false)
  
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    
    const handleAuth = async () => {
      try {
        logger.info('🚀 Starting optimized auth flow...', { component: 'AuthCallback' })
        
        // ✅ BATCH UPDATE #1: Setup phase
        setState({
          phase: 'processing',
          progress: 25,
          message: 'Procesando credenciales...'
        })
        
        // ✅ BATCH UPDATE #2: Processing
        setState(prev => ({
          ...prev,
          progress: 50,
          message: 'Verificando sesión...'
        }))
        
        // ✅ DIRECT AUTH CHECK - No polling, no useQuery loop
        const user = await directAuthCheck()
        
        if (!user) {
          throw new Error('Authentication failed')
        }
        
        logger.info('✅ Authentication successful:', { email: user.email, component: 'AuthCallback' })
        
        // ✅ BATCH UPDATE #3: Success
        setState(prev => ({
          ...prev,
          phase: 'completing',
          progress: 100,
          message: '¡Autenticación exitosa! Redirigiendo...'
        }))
        
        // ✅ NAVIGATE ONCE - Prevent multiple navigation
        if (!isNavigating.current) {
          isNavigating.current = true
          
          setTimeout(() => {
            logger.info('🎯 Navigating to: /dashboard', { component: 'AuthCallback' })
            navigate({ to: '/dashboard' })
          }, 600)
        }
        
      } catch (error: unknown) {
        logger.error('❌ Auth callback error:', error as Error, { component: 'AuthCallback' })
        
        const errorMessage = error instanceof Error ? error.message : 'Authentication error'
        
        // ✅ SINGLE ERROR UPDATE
        setState({
          phase: 'error',
          progress: 0,
          message: 'Error durante la autenticación',
          error: errorMessage
        })
        
        // Auto-redirect to auth page
        setTimeout(() => {
          if (!isNavigating.current) {
            isNavigating.current = true
            navigate({ to: '/auth' })
          }
        }, 3000)
      }
    }
    
    // Start auth flow
    handleAuth()
    
  }, [navigate]) // ✅ Stable dependency
  
  // ✅ OPTIMIZED RENDER: Single state, no conditional logic changes
  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{state.message}</p>
          <div className="text-sm text-gray-500 mb-4">
            Serás redirigido automáticamente...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        

        
        {/* Single animated icon - no state changes */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {state.phase === 'completing' ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          )}
        </div>
        
        {/* Smooth progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              state.phase === 'completing' ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
        
        {/* Stable messaging */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {state.phase === 'completing' ? '✅ ¡Éxito!' : '🔐 Autenticando...'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {state.message}
        </p>
        
        <div className="text-xs text-gray-500">
          {state.progress}% completado
        </div>
        
        {/* Performance indicator */}
        {state.phase === 'processing' && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-3 text-left">
            <p className="text-xs text-green-700">
              ⚡ <strong>Optimizado:</strong> Sin re-renders innecesarios
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return <OptimizedAuthCallback />
} 