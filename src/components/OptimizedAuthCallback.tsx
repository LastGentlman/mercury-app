/**
 * 🚀 OptimizedAuthCallback - Zero Flicker OAuth Component
 * 
 * @description Componente optimizado que elimina completamente el parpadeo durante OAuth
 * Implementa todas las optimizaciones identificadas en el análisis profundo
 */

import { useRef, useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AuthService } from '../services/auth-service.ts'
import { getSearchParams, getHash } from '../utils/browser.ts'
import { logger } from '../utils/logger.ts'
import type { AuthUser } from '../types/auth.ts'

interface ModalContext {
  returnTo: string
  timestamp: number
  provider: 'google' | 'facebook'
  source: 'modal'
}

interface AuthCallbackState {
  phase: 'connecting' | 'processing' | 'completing' | 'error'
  progress: number
  message: string
  error?: string
  context?: ModalContext | null
}

export const OptimizedAuthCallback = () => {
  const navigate = useNavigate()
  
  // ✅ OPTIMIZADO: Single state to prevent re-renders
  const [state, setState] = useState<AuthCallbackState>({
    phase: 'connecting',
    progress: 10,
    message: 'Conectando...'
  })
  
  // ✅ OPTIMIZADO: Refs to prevent multiple executions
  const hasStarted = useRef(false)
  const isNavigating = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const sessionChecked = useRef(false)
  const authStateCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const startTime = performance.now()
    logger.debug('🚀 OAuth callback started', { timestamp: startTime })
    
    const handleAuth = async () => {
      try {
        const urlParams = getSearchParams()
        const hash = getHash()
        
        // ✅ OPTIMIZADO: Single OAuth parameter check
        const hasOAuthParams = urlParams.toString().includes('code') || 
                              urlParams.toString().includes('access_token') ||
                              hash.includes('access_token') ||
                              hash.includes('code')
        
        logger.debug('🔍 OAuth parameters check:', { 
          hasOAuthParams, 
          searchParams: urlParams.toString(),
          hash: hash,
          timestamp: performance.now() - startTime
        })
        
        if (!hasOAuthParams) {
          // 🚀 FAST PATH: Single session check only
          logger.debug('⚡ Fast path: checking existing session')
          const user = await AuthService.getCurrentUser()
          if (user) {
            handleSuccess(user, null)
          } else {
            // Redirect to auth if no session
            setTimeout(() => {
              if (!isNavigating.current) {
                isNavigating.current = true
                navigate({ to: '/auth' })
              }
            }, 1000)
          }
          return
        }
        
        // 🔄 OAUTH PATH: Event-driven only
        logger.debug('🔄 OAuth path: setting up listener')
        setState({
          phase: 'processing', 
          progress: 40, 
          message: 'Procesando autenticación OAuth...'
        })
        
        // ✅ CRITICAL: Single event listener with immediate response
        const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
          const eventTime = performance.now() - startTime
          logger.debug('📡 Auth state change:', { 
            event, 
            hasSession: !!session,
            timestamp: eventTime
          })
          
          if (event === 'SIGNED_IN' && session && !isNavigating.current && !sessionChecked.current) {
            sessionChecked.current = true
            logger.info('✅ OAuth session established', { timestamp: eventTime })
            
            // ✅ OPTIMIZADO: Immediate user fetch without delay
            AuthService.getCurrentUser()
              .then(user => {
                const userTime = performance.now() - startTime
                if (user && !isNavigating.current) {
                  logger.info('👤 User data retrieved', { timestamp: userTime })
                  const modalContext = getModalContext()
                  handleSuccess(user, modalContext)
                } else if (!isNavigating.current) {
                  handleError(new Error('Failed to get user data'))
                }
              })
                             .catch(error => {
                 const errorObj = error instanceof Error ? error : new Error(String(error))
                 logger.error('❌ Error getting user:', errorObj)
                 if (!isNavigating.current) {
                   handleError(errorObj)
                 }
               })
          } else if (event === 'SIGNED_OUT') {
            logger.warn('🚪 Unexpected sign out during OAuth')
            if (!isNavigating.current) {
              handleError(new Error('Authentication was cancelled'))
            }
          }
        })
        
        authStateCleanup.current = () => subscription.unsubscribe()
        
        // ⏰ Safety timeout: Single fallback check
        timeoutRef.current = globalThis.setTimeout(() => {
          if (!isNavigating.current && !sessionChecked.current) {
            const timeoutTime = performance.now() - startTime
            logger.warn('⏰ OAuth timeout, attempting session check', { timestamp: timeoutTime })
            sessionChecked.current = true
            
            AuthService.getCurrentUser()
              .then(user => {
                if (user && !isNavigating.current) {
                  const modalContext = getModalContext()
                  handleSuccess(user, modalContext)
                } else if (!isNavigating.current) {
                  handleError(new Error('Authentication timeout'))
                }
              })
              .catch(_error => {
                if (!isNavigating.current) {
                  handleError(new Error('Authentication timeout'))
                }
              })
          }
        }, 8000)
        
      } catch (error) {
        const errorTime = performance.now() - startTime
        logger.error('❌ Auth callback setup error:', error instanceof Error ? error : new Error(String(error)), { timestamp: errorTime })
        handleError(error)
      }
    }

    const handleSuccess = (user: AuthUser, context: ModalContext | null) => {
      if (isNavigating.current) return
      
      const successTime = performance.now() - startTime
      logger.info('🎉 Authentication successful:', { 
        email: user.email, 
        provider: user.provider,
        timestamp: successTime
      })
      
      // Cleanup
      cleanup()
      
      // Clear modal context
      if (context) {
        AuthService.clearModalContext()
      }
      
      setState({
        phase: 'completing',
        progress: 100,
        message: '¡Autenticación exitosa!'
      })
      
      // ✅ CRITICAL: Immediate navigation - NO DELAY
      isNavigating.current = true
      const returnTo = context?.returnTo || '/dashboard'
      
      logger.info(`🚀 Navigating to: ${returnTo}`, { timestamp: successTime })
      navigate({ to: returnTo })
    }

    const handleError = (error: unknown) => {
      if (isNavigating.current) return
      
      const errorTime = performance.now() - startTime
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.error('💥 Auth callback failed:', errorObj, { timestamp: errorTime })
      
      cleanup()
      
      const errorMessage = errorObj.message
      setState({
        phase: 'error',
        progress: 0,
        message: 'Error durante la autenticación',
        error: errorMessage
      })
      
      setTimeout(() => {
        if (!isNavigating.current) {
          isNavigating.current = true
          navigate({ to: '/auth' })
        }
      }, 3000)
    }

    const getModalContext = (): ModalContext | null => {
      const urlParams = getSearchParams()
      const isFromModal = urlParams.get('source') === 'modal'
      return isFromModal ? AuthService.getModalContext() : null
    }

    const cleanup = () => {
      if (authStateCleanup.current) {
        authStateCleanup.current()
        authStateCleanup.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    handleAuth()
    return cleanup
  }, [navigate])

  // ✅ OPTIMIZADO: Minimal UI with no transitions that cause flicker
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
          {state.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-mono">{state.error}</p>
            </div>
          )}
          <div className="text-sm text-gray-500 mb-4">
            Serás redirigido automáticamente al login...
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: '/auth' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  // ✅ OPTIMIZADO: Loading state with minimal animations
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        
        {/* Context indicator */}
        {state.context && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              🔐 {state.context.provider.charAt(0).toUpperCase() + state.context.provider.slice(1)}
            </p>
          </div>
        )}
        
        {/* Static icon - no animations that cause flicker */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {state.phase === 'completing' ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          )}
        </div>
        
        {/* Static progress bar - no transitions */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className={`h-2 rounded-full ${
              state.phase === 'completing' ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
        
        {/* Static messaging */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {state.phase === 'connecting' && '🔗 Conectando...'}
          {state.phase === 'processing' && '🔐 Autenticando...'}
          {state.phase === 'completing' && '✅ ¡Éxito!'}
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
              ⚡ <strong>Zero-flicker:</strong> Optimizado para máxima velocidad
            </p>
          </div>
        )}

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
            <p className="text-xs text-gray-600 font-mono">
              🔍 Debug: {state.phase} | {state.progress}% | {state.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 