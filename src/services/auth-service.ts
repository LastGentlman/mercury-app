/**
 * Authentication service layer
 * Handles API communication for authentication operations
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials, 
  LoginResponse, 
  RegistrationResponse,
  SocialLoginOptions 
} from '../types/auth'
import { handleApiError, createAuthError as _createAuthError } from '../utils/auth-errors'
import { env } from '../env'

/**
 * Supabase client configuration with debugging
 * Only create client if environment variables are properly configured
 */
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ Configured' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Configured' : '❌ Missing',
  env: import.meta.env.MODE
})

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

if (!supabase) {
  console.warn('⚠️ Supabase no está configurado. OAuth no funcionará.')
}

/**
 * Gets the API base URL from environment
 */
function getApiUrl(): string {
  return env.VITE_BACKEND_URL || 'http://localhost:3030'
}

export class AuthService {
  static supabase = supabase

  /**
   * Gets current user session from Supabase OAuth - Versión mejorada
   */
  static async getOAuthSession(): Promise<AuthUser | null> {
    if (!supabase) {
      console.log('⚠️ Supabase no configurado, saltando OAuth session check')
      return null
    }

    try {
      console.log('🔍 Verificando sesión OAuth...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error obteniendo sesión OAuth:', error)
        return null
      }

      if (!session?.user) {
        console.log('ℹ️ No hay sesión OAuth activa')
        return null
      }

      const { user } = session
      console.log('📊 Datos de usuario OAuth:', {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        confirmed_at: user.email_confirmed_at,
        metadata: user.user_metadata
      })
      
      // Mapear datos de usuario OAuth a nuestro formato
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 
              user.user_metadata?.full_name || 
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] || 
              'Usuario',
        avatar_url: user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture,
        provider: (user.app_metadata?.provider || 'email') as 'email' | 'google' | 'facebook',
        businessId: user.user_metadata?.businessId,
        role: user.user_metadata?.role || 'owner'
      }

      console.log('✅ Usuario OAuth mapeado:', {
        email: authUser.email,
        provider: authUser.provider,
        name: authUser.name
      })

      return authUser
    } catch (error) {
      console.error('❌ Error inesperado obteniendo sesión OAuth:', error)
      return null
    }
  }

  /**
   * Gets user profile from traditional auth backend
   */
  static async getTraditionalProfile(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid, remove it
          return null
        }
        await handleApiError(response, 'email')
      }

      const data = await response.json()
      return {
        ...data.profile,
        provider: 'email' as const
      }
    } catch (error) {
      console.error('Error fetching traditional profile:', error)
      return null
    }
  }

  /**
   * Gets current user - used by useAuth hook
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // First check OAuth session
      const oauthUser = await this.getOAuthSession()
      if (oauthUser) {
        return oauthUser
      }

      // Then check traditional auth
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return null

      const response = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid, remove it
          localStorage.removeItem('authToken')
          return null
        }
        throw new Error('Failed to get user')
      }

      const userData = await response.json()
      return {
        ...userData,
        provider: 'email' as const
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * OAuth Social Login - Versión mejorada con debugging
   */
  static async socialLogin({ provider, redirectTo }: SocialLoginOptions): Promise<void> {
    if (!supabase) {
      const error = 'OAuth no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      console.error('❌', error)
      throw new Error(error)
    }

    try {
      const callbackUrl = redirectTo || `${window.location.origin}/auth/callback`
      console.log(`🚀 Iniciando login con ${provider}...`)
      console.log('📍 Redirect URL:', callbackUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : {},
          scopes: provider === 'google' 
            ? 'openid email profile'
            : 'email'
        },
      })

      if (error) {
        console.error(`❌ Error en signInWithOAuth:`, error)
        throw new Error(`Error en login con ${provider}: ${error.message}`)
      }

      console.log(`✅ OAuth iniciado correctamente para ${provider}`, data)
      console.log('🔄 Redirigiendo al proveedor...')
      
    } catch (error) {
      console.error(`❌ Error inesperado en socialLogin:`, error)
      throw error
    }
  }

  /**
   * Performs traditional email/password login
   */
  static async login({ email, password }: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      await handleApiError(response, 'email')
    }

    const data = await response.json()
    
    return {
      ...data,
      user: {
        ...data.user,
        provider: 'email' as const
      }
    }
  }

  /**
   * Performs traditional email/password registration
   */
  static async register({ email, password, name }: RegisterCredentials): Promise<RegistrationResponse> {
    const response = await fetch(`${getApiUrl()}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    })

    if (!response.ok) {
      await handleApiError(response, 'email')
    }

    const data = await response.json()
    
    return {
      ...data,
      user: {
        ...data.user,
        provider: 'email' as const
      }
    }
  }

  /**
   * Logout mejorado
   */
  static async logout(): Promise<void> {
    console.log('🚪 Iniciando logout...')
    
    // Logout de Supabase OAuth
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('🔓 Cerrando sesión OAuth...')
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.error('❌ Error en logout OAuth:', error)
          } else {
            console.log('✅ Logout OAuth exitoso')
          }
        }
      } catch (error) {
        console.error('❌ Error durante logout OAuth:', error)
      }
    }

    // Limpiar token tradicional
    const authToken = localStorage.getItem('authToken')
    if (authToken) {
      console.log('🧹 Limpiando token tradicional...')
      try {
        // Llamada al backend para logout tradicional
        await fetch(`${getApiUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
        localStorage.removeItem('authToken')
        console.log('✅ Logout tradicional exitoso')
      } catch (error) {
        console.error('❌ Error logout tradicional:', error)
        // Remover token aunque haya error en el servidor
        localStorage.removeItem('authToken')
      }
    }
    
    console.log('✅ Logout completo')
  }

  /**
   * Resends email confirmation
   */
  static async resendConfirmationEmail(email: string): Promise<void> {
    const response = await fetch(`${getApiUrl()}/api/auth/resend-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      await handleApiError(response, 'email')
    }
  }

  /**
   * Escuchar cambios de estado - Versión mejorada
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      console.log('⚠️ Supabase no configurado, auth state change no disponible')
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log('🔕 Dummy unsubscribe called')
          }
        }
      }
    }

    console.log('👂 Configurando listener de auth state changes...')
    
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔄 Auth state cambió: ${event}`, {
        hasSession: !!session,
        userEmail: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })
      callback(event, session)
    })
  }
}

 