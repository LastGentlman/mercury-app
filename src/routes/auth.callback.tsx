import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
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

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

interface AuthCallbackState {
  phase: 'connecting' | 'processing' | 'completing' | 'error'
  progress: number
  message: string
  error?: string
  context?: ModalContext | null
}

// ✅ SOLUCIÓN OPTIMIZADA: Single Session Check + Event-Driven
export const ZeroFlickerAuthCallback = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<AuthCallbackState>({
    phase: 'connecting',
    progress: 10,
    message: 'Conectando...'
  })
  
  const hasStarted = useRef(false)
  const isNavigating = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const sessionChecked = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    let authStateCleanup: (() => void) | null = null
    
    const handleAuth = async () => {
      try {
        const urlParams = getSearchParams()
        const hash = getHash()
        
        // ✅ OPTIMIZADO: Single OAuth parameter check
        const hasOAuthParams = urlParams.toString().includes('code') || 
                              urlParams.toString().includes('access_token') ||
                              hash.includes('access_token') ||
                              hash.includes('code')
        
        logger.debug('Auth callback started:', { 
          hasOAuthParams, 
          searchParams: urlParams.toString(),
          hash: hash,
          component: 'AuthCallback' 
        })
        
        if (!hasOAuthParams) {
          // 🚀 FAST PATH: Single session check only
          logger.debug('No OAuth params, checking existing session')
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
        logger.debug('OAuth params detected, setting up listener')
        setState({
          phase: 'processing', 
          progress: 40, 
          message: 'Procesando autenticación OAuth...'
        })
        
        // ✅ CRITICAL: Single event listener
        const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
          logger.debug('Auth state change:', { event, hasSession: !!session })
          
          if (event === 'SIGNED_IN' && session && !isNavigating.current && !sessionChecked.current) {
            sessionChecked.current = true
            logger.info('OAuth session established')
            
            // ✅ OPTIMIZADO: Single user fetch
            AuthService.getCurrentUser()
              .then(user => {
                if (user && !isNavigating.current) {
                  const modalContext = getModalContext()
                  handleSuccess(user, modalContext)
                } else if (!isNavigating.current) {
                  handleError(new Error('Failed to get user data'))
                }
              })
              .catch(error => {
                logger.error('Error getting user:', error)
                if (!isNavigating.current) {
                  handleError(error)
                }
              })
          } else if (event === 'SIGNED_OUT') {
            logger.warn('Unexpected sign out during OAuth')
            if (!isNavigating.current) {
              handleError(new Error('Authentication was cancelled'))
            }
          }
        })
        
        authStateCleanup = () => subscription.unsubscribe()
        
        // ⏰ Safety timeout: Single fallback check
        timeoutRef.current = globalThis.setTimeout(() => {
          if (!isNavigating.current && !sessionChecked.current) {
            logger.warn('OAuth timeout, attempting single session check')
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
        const errorObj = error instanceof Error ? error : new Error(String(error))
        logger.error('Auth callback setup error:', errorObj)
        handleError(error)
      }
    }

    const handleSuccess = (user: AuthUser, context: ModalContext | null) => {
      if (isNavigating.current) return
      
      logger.info('Authentication successful:', { 
        email: user.email, 
        provider: user.provider,
        component: 'AuthCallback' 
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
      
      // Navigate immediately
      isNavigating.current = true
      const returnTo = context?.returnTo || '/dashboard'
      
      setTimeout(() => {
        logger.info(`Navigating to: ${returnTo}`)
        navigate({ to: returnTo })
      }, 300)
    }

    const handleError = (error: unknown) => {
      if (isNavigating.current) return
      
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.error('Auth callback failed:', errorObj, { component: 'AuthCallback' })
      
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
      if (authStateCleanup) {
        authStateCleanup()
        authStateCleanup = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    handleAuth()
    return cleanup
  }, [navigate])

  // Error state UI
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  // Loading state UI
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
        
        {/* Animated icon */}
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
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              state.phase === 'completing' ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
        
        {/* Messaging */}
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
              ⚡ <strong>Optimizado:</strong> Single session check + Event-driven
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

export default function AuthCallbackPage() {
  return <ZeroFlickerAuthCallback />
} 