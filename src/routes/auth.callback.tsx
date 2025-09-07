import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { AuthService } from '../services/auth-service.ts'
import { getSearchParams, getHash } from '../utils/browser.ts'
import { logger } from '../utils/logger.ts'
import type { AuthUser } from '../types/auth.ts'
import { perf } from '../utils/perf.ts'
import { useRedirectManager } from '../utils/redirectManager.ts'

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

// ✅ OPTIMIZACIÓN 2: Enhanced OAuth Parameter Detection
function detectOAuthParameters(): boolean {
  const searchParams = getSearchParams().toString()
  const hash = getHash()
  
  // Check for OAuth parameters in search params
  const hasSearchParams = searchParams.includes('access_token') || 
                         searchParams.includes('code') ||
                         searchParams.includes('error')
  
  // Check for OAuth parameters in hash fragment
  const hasHashParams = hash.includes('access_token') || 
                       hash.includes('code') ||
                       hash.includes('error') ||
                       hash.includes('type=recovery')
  
  logger.debug('🔍 OAuth parameter detection:', {
    searchParams,
    hash,
    hasSearchParams,
    hasHashParams,
    component: 'AuthCallback'
  })
  
  return hasSearchParams || hasHashParams
}

// ✅ OPTIMIZACIÓN 3: Enhanced Auth Check with Fragment Support
async function directAuthCheck(): Promise<AuthUser | null> {
  perf.mark('oauth_cb:start')
  logger.debug('🔍 Direct authentication check...', { component: 'AuthCallback' })
  
  // Check for OAuth parameters in both search and hash
  const hasOAuthParams = detectOAuthParameters()
  perf.mark('oauth_cb:detected')
  
  if (hasOAuthParams) {
    logger.debug('🔑 OAuth parameters detected, processing...', { component: 'AuthCallback' })
    
    // Give Supabase minimal time to process URL parameters and hash fragments
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Force Supabase to process the session from URL
    try {
      if (AuthService.supabase) {
        logger.debug('🔄 Forcing Supabase session processing...', { component: 'AuthCallback' })
        
        // Get session immediately after processing
        const { data: { session }, error } = await AuthService.supabase.auth.getSession()
        
        if (error) {
          logger.error('❌ Supabase session error:', error)
        } else if (session) {
          logger.info('✅ Supabase session found:', { 
            userId: session.user.id, 
            email: session.user.email,
            component: 'AuthCallback' 
          })
        }
      }
    } catch (_error) {
      logger.warn('⚠️ Supabase session processing failed:', { component: 'AuthCallback' })
    }
  }
  perf.mark('oauth_cb:supabase_session_checked')
  perf.measure('oauth_cb:to_supabase_session', 'oauth_cb:start', 'oauth_cb:supabase_session_checked')
  
  // Try to get user from OAuth session only (avoid extra profile fetch here)
  try {
    const user = await perf.timeAsync('oauth_cb:get_oauth_session', () => AuthService.getOAuthSession())
    if (user) {
      perf.mark('oauth_cb:user_ready')
      perf.measure('oauth_cb:total_to_user', 'oauth_cb:start', 'oauth_cb:user_ready')
      logger.info('✅ User authenticated (OAuth session):', { email: user.email, component: 'AuthCallback' })
      return user
    }
  } catch (_error) {
    logger.warn('⚠️ First attempt failed, trying fallback...', { component: 'AuthCallback' })
  }
  
  // Short fallback with minimal delay for fragment-based auth
  if (hasOAuthParams) {
    logger.debug('🔄 Enhanced fallback for OAuth parameters...', { component: 'AuthCallback' })
    await new Promise(resolve => setTimeout(resolve, 250))
  } else {
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  
  try {
    const user = await perf.timeAsync('oauth_cb:get_oauth_session_retry', () => AuthService.getOAuthSession())
    if (user) {
      perf.mark('oauth_cb:user_ready')
      perf.measure('oauth_cb:total_to_user', 'oauth_cb:start', 'oauth_cb:user_ready')
      logger.info('✅ User authenticated on retry (OAuth session):', { email: user.email, component: 'AuthCallback' })
      return user
    }
  } catch (error) {
    logger.error('❌ Auth check failed:', error as Error)
    throw new Error('Authentication failed after retry')
  }
  
  throw new Error('No user found after authentication')
}

// ✅ OPTIMIZACIÓN 4: Zero Re-render Callback Component  
export const OptimizedAuthCallback = () => {
  const navigate = useNavigate()
  const { resetRedirectCount } = useRedirectManager()
  
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
        perf.mark('oauth_cb:component_mounted')
        
        // Log current URL state for debugging
        const currentUrl = globalThis.location.href
        const urlHash = globalThis.location.hash
        const urlSearch = globalThis.location.search
        
        logger.debug('📍 Current URL state:', {
          url: currentUrl,
          hash: urlHash,
          search: urlSearch,
          component: 'AuthCallback'
        })
        
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
        
        // ✅ NAVIGATE ONCE - Prevent multiple navigation with multiple fallbacks
        if (!isNavigating.current) {
          isNavigating.current = true
          perf.mark('oauth_cb:navigate_start')
          
          // Reset redirect count on successful authentication
          resetRedirectCount()
          
          // Primary navigation attempt (no artificial delay)
          setTimeout(() => {
            logger.info('🎯 Attempting TanStack Router navigation to: /dashboard', { component: 'AuthCallback' })
            try {
              navigate({ to: '/dashboard' })
            } catch (navError) {
              logger.error('❌ TanStack Router navigation failed, trying window.location:', navError as Error)
              globalThis.window.location.href = '/dashboard'
            }
          }, 0)
          
          // Secondary fallback after 2 seconds
          setTimeout(() => {
            if (globalThis.window.location.pathname.includes('/auth/callback')) {
              logger.warn('⚠️ Still on callback page after 2s, trying window.location...')
              globalThis.window.location.href = '/dashboard'
            }
          }, 2000)
          
          // Final fallback after 5 seconds
          setTimeout(() => {
            if (globalThis.window.location.pathname.includes('/auth/callback')) {
              logger.error('❌ Still on callback page after 5s, forcing page reload...')
              globalThis.window.location.reload()
            }
          }, 5000)
        }
        
      } catch (error: unknown) {
        logger.error('❌ Auth callback error:', error as Error)
        
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
            globalThis.window.location.href = '/auth'
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

function AuthCallbackPage() {
  return <OptimizedAuthCallback />
} 