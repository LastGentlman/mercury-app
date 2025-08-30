import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { AuthService } from '../services/auth-service.ts'
import { getSearchParams, getHash, getCurrentUrlInfo } from '../utils/browser.ts'
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

// ✅ SOLUCIÓN MEJORADA: Event-Driven Auth Callback con Debugging
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

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    let authStateCleanup: (() => void) | null = null
    
    const handleAuth = async () => {
      try {
        // 🔍 DEBUGGING: Log current URL state
        const urlInfo = getCurrentUrlInfo()
        logger.info('Auth callback started with URL:', {
          href: urlInfo.href,
          search: urlInfo.search,
          hash: urlInfo.hash,
          component: 'AuthCallback'
        })

        const urlParams = getSearchParams()
        const hash = getHash()
        
        // 🔍 DEBUGGING: Log parameters
        logger.debug('URL parameters analysis:', {
          searchParams: urlParams.toString(),
          hash: hash,
          hasCode: urlParams.toString().includes('code'),
          hasAccessToken: urlParams.toString().includes('access_token') || hash.includes('access_token'),
          component: 'AuthCallback'
        })

        // ✅ MEJORADO: Detección de parámetros OAuth más robusta
        const hasOAuthParams = urlParams.toString().includes('code') || 
                              urlParams.toString().includes('access_token') ||
                              hash.includes('access_token') ||
                              hash.includes('code') ||
                              // Verificar si hay parámetros en el hash (formato OAuth)
                              hash.includes('token_type') ||
                              hash.includes('expires_in')
        
        // 🔍 DEBUGGING: Log OAuth detection result
        logger.debug('OAuth parameters detection:', {
          hasOAuthParams,
          searchParams: urlParams.toString(),
          hash: hash,
          component: 'AuthCallback'
        })
        
        // ✅ ESPECIAL: Manejo de hash vacío (#)
        if (hash === '#' || hash === '') {
          logger.warn('Empty hash fragment detected, checking for existing session', { component: 'AuthCallback' })
          
          try {
            const user = await AuthService.getCurrentUser()
            if (user) {
              logger.info('Session found despite empty hash, proceeding to success', { 
                email: user.email, 
                component: 'AuthCallback' 
              })
              handleSuccess(user, null)
              return
            } else {
              logger.warn('No session found with empty hash, redirecting to auth', { component: 'AuthCallback' })
              setTimeout(() => {
                if (!isNavigating.current) {
                  isNavigating.current = true
                  navigate({ to: '/auth' })
                }
              }, 1000)
              return
            }
          } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))
            logger.error('Error checking session with empty hash:', errorObj, { component: 'AuthCallback' })
            handleError(error)
            return
          }
        }
        
        if (!hasOAuthParams) {
          // 🚀 FAST PATH: No OAuth parameters, check existing session
          logger.info('No OAuth params detected, checking existing session', { component: 'AuthCallback' })
          
          try {
            const user = await AuthService.getCurrentUser()
            if (user) {
              logger.info('Existing session found, proceeding to success', { 
                email: user.email, 
                component: 'AuthCallback' 
              })
              handleSuccess(user, null)
            } else {
              logger.warn('No existing session found, redirecting to auth', { component: 'AuthCallback' })
              // Redirect to auth page if no session and no OAuth params
              setTimeout(() => {
                if (!isNavigating.current) {
                  isNavigating.current = true
                  navigate({ to: '/auth' })
                }
              }, 1000)
            }
          } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))
            logger.error('Error checking existing session:', errorObj, { component: 'AuthCallback' })
            handleError(error)
          }
          return
        }
        
        // 🔄 OAUTH PATH: Use event-driven approach for perfect timing
        logger.info('OAuth parameters detected, setting up Supabase listener', { component: 'AuthCallback' })
        setState({
          phase: 'processing', 
          progress: 40, 
          message: 'Procesando autenticación OAuth...'
        })
        
        // ✅ CRITICAL: Use onAuthStateChange for precise synchronization
        const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
          logger.debug('Auth state change event:', { 
            event, 
            hasSession: !!session,
            component: 'AuthCallback' 
          })
          
          if (event === 'SIGNED_IN' && session && !isNavigating.current) {
            logger.info('OAuth session established by Supabase', { component: 'AuthCallback' })
            
            // Convert Supabase session to AuthUser
            AuthService.getCurrentUser()
              .then(user => {
                if (user && !isNavigating.current) {
                  const modalContext = getModalContext()
                  handleSuccess(user, modalContext)
                } else if (!isNavigating.current) {
                  logger.warn('Session established but no user found', { component: 'AuthCallback' })
                  handleError(new Error('Failed to get user data'))
                }
              })
              .catch(error => {
                logger.error('Error getting user after session established:', error, { component: 'AuthCallback' })
                if (!isNavigating.current) {
                  handleError(error)
                }
              })
          } else if (event === 'SIGNED_OUT') {
            logger.warn('Unexpected sign out during OAuth callback', { component: 'AuthCallback' })
            if (!isNavigating.current) {
              handleError(new Error('Authentication was cancelled'))
            }
          }
        })
        
        authStateCleanup = () => subscription.unsubscribe()
        
        // ⏰ Safety timeout: If Supabase doesn't respond within reasonable time
        timeoutRef.current = globalThis.setTimeout(() => {
          logger.warn('OAuth processing timeout, attempting direct session check', { component: 'AuthCallback' })
          
          // Fallback: Direct session check after timeout
          AuthService.getCurrentUser()
            .then(user => {
              if (user && !isNavigating.current) {
                const modalContext = getModalContext()
                handleSuccess(user, modalContext)
              } else if (!isNavigating.current) {
                logger.error('Timeout reached with no session found', undefined, { component: 'AuthCallback' })
                handleError(new Error('Authentication timeout - no session found'))
              }
            })
            .catch(error => {
              if (!isNavigating.current) {
                logger.error('Direct session check failed after timeout:', error, { component: 'AuthCallback' })
                handleError(new Error('Authentication timeout'))
              }
            })
        }, 8000) // 8 second timeout
        
        // ✅ OPTIMIZATION: Also check immediately if session already exists
        // (In case the auth state change event was missed)
        setTimeout(async () => {
          if (!isNavigating.current) {
            try {
              const user = await AuthService.getCurrentUser()
              if (user) {
                logger.debug('Found existing session during immediate check', { component: 'AuthCallback' })
                const modalContext = getModalContext()
                handleSuccess(user, modalContext)
              }
            } catch (_error) {
              // Ignore - the event listener will handle it
              logger.debug('Immediate session check failed, waiting for auth state change', { component: 'AuthCallback' })
            }
          }
        }, 100) // Quick check after 100ms
        
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        logger.error('Auth callback setup error:', errorObj, { component: 'AuthCallback' })
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
      
      // Cleanup all listeners and timeouts
      cleanup()
      
      // Clear modal context if exists
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
      
      // Minimal delay just to show success state
      setTimeout(() => {
        logger.info(`Navigating to: ${returnTo}`, { component: 'AuthCallback' })
        navigate({ to: returnTo })
      }, 300) // Reduced to minimum
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
      
      // Auto-redirect to login on error
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

    // Start the authentication process
    handleAuth()

    // Cleanup on component unmount
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
        
        {/* Animated icon - changes based on phase */}
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
        
        {/* Phase-appropriate messaging */}
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
              ⚡ <strong>Zero-flicker:</strong> Sincronización perfecta con OAuth
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