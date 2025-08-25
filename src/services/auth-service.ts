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
} from '../types/auth.ts'
import { handleApiError, createAuthError as _createAuthError } from '../utils/auth-errors.ts'
import { env } from '../env.ts'

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
      
      // Debugging logs removed - avatar system working correctly

      // Try to get avatar URL from OAuth data first
      let avatarUrl = user.user_metadata?.picture || 
                     user.user_metadata?.avatar_url ||
                     user.identities?.[0]?.identity_data?.picture ||
                     user.identities?.[0]?.identity_data?.avatar_url

      // Google People API removed - using direct Google avatar URL instead

      // Fallback: Use Google's public avatar service
      if (!avatarUrl && user.app_metadata?.provider === 'google') {
        const googleUserId = user.user_metadata?.provider_id || user.identities?.[0]?.id
        if (googleUserId) {
          // Use Google's public avatar URL format
          avatarUrl = `https://lh3.googleusercontent.com/-${googleUserId}/photo?sz=150`
          console.log('✅ Using Google public avatar URL:', avatarUrl)
        }
      }

      // Mapear datos de usuario OAuth a nuestro formato
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 
              user.user_metadata?.full_name || 
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] || 
              'Usuario',
        avatar_url: avatarUrl,
        provider: (user.app_metadata?.provider || 'email') as 'email' | 'google' | 'facebook',
        businessId: user.user_metadata?.businessId,
        role: user.user_metadata?.role || 'owner'
      }

      console.log('✅ Usuario OAuth mapeado:', {
        email: authUser.email,
        provider: authUser.provider,
        name: authUser.name,
        avatar_url: authUser.avatar_url
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
   * OAuth Social Login - Versión con popup en lugar de redirect
   */
  static async socialLogin({ provider, redirectTo }: SocialLoginOptions): Promise<void> {
    if (!supabase) {
      const error = 'OAuth no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      console.error('❌', error)
      throw new Error(error)
    }

    try {
      const callbackUrl = redirectTo || `${globalThis.location.origin}/auth/callback`
      console.log(`🚀 Iniciando login con ${provider} en popup...`)
      console.log('📍 Callback URL:', callbackUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true, // Esto evita la redirección automática
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
          } : {},
          scopes: provider === 'google' 
            ? 'openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
            : 'email'
        },
      })

      if (error) {
        console.error(`❌ Error en signInWithOAuth:`, error)
        throw new Error(`Error en login con ${provider}: ${error.message}`)
      }

      if (data.url) {
        console.log(`✅ OAuth URL generada para ${provider}`, data.url)
        
        // Abrir popup con la URL de OAuth
        const popup = globalThis.open(
          data.url,
          `${provider}_oauth`,
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        )
        
        if (!popup) {
          throw new Error('No se pudo abrir la ventana popup. Verifica que el bloqueador de popups esté deshabilitado.')
        }

        // Escuchar el mensaje de la ventana popup cuando se complete la autenticación
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== globalThis.location.origin) return
          
          if (event.data?.type === 'OAUTH_SUCCESS') {
            console.log('✅ OAuth completado exitosamente en popup')
            popup.close()
            globalThis.removeEventListener('message', messageListener)
            
            // Refrescar el estado de autenticación
            setTimeout(() => {
              globalThis.location.reload()
            }, 500)
          } else if (event.data?.type === 'OAUTH_ERROR') {
            console.error('❌ Error en OAuth popup:', event.data.error)
            popup.close()
            globalThis.removeEventListener('message', messageListener)
            throw new Error(event.data.error)
          }
        }

        globalThis.addEventListener('message', messageListener)

        // Verificar si la ventana se cerró manualmente
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            globalThis.removeEventListener('message', messageListener)
            console.log('ℹ️ Ventana popup cerrada por el usuario')
          }
        }, 1000)

      } else {
        throw new Error('No se pudo generar la URL de OAuth')
      }
      
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
   * Changes email for unconfirmed user
   */
  static async changeEmail(currentEmail: string, newEmail: string): Promise<{ newEmail: string }> {
    const response = await fetch(`${getApiUrl()}/api/auth/change-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentEmail, newEmail }),
    })

    if (!response.ok) {
      await handleApiError(response, 'email')
    }

    const data = await response.json()
    return { newEmail: data.newEmail }
  }

  /**
   * Escuchar cambios de estado - Versión mejorada
   */
  static onAuthStateChange(callback: (event: string, session: unknown) => void) {
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

  /**
   * Force Google OAuth re-authentication with updated scopes
   * This is needed when the current session doesn't have People API access
   */
  static async forceGoogleReauth(): Promise<void> {
    console.log('🔄 Forcing Google OAuth re-authentication...')
    
    // Clear the re-auth flag
    localStorage.removeItem('google_avatar_reauth_needed')
    
    // Sign out current session
    if (supabase) {
      await supabase.auth.signOut()
    }
    
    // Clear local storage
    localStorage.removeItem('authToken')
    
    // Redirect to Google OAuth with updated scopes
    await this.socialLogin({
      provider: 'google',
      redirectTo: `${globalThis.location?.origin || import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`
    })
  }

  /**
   * Fetch Google profile picture using Google People API as fallback
   * REMOVED - Using direct Google avatar URL instead
   */

  /**
   * Test different Google avatar URL formats to find one that works
   */
  static async testGoogleAvatarFormats(googleUserId: string): Promise<string | null> {
    const formats = [
      `https://lh3.googleusercontent.com/-${googleUserId}/photo?sz=150`,
      `https://lh3.googleusercontent.com/-${googleUserId}/photo?sz=96`,
      `https://lh3.googleusercontent.com/-${googleUserId}/photo`,
      `https://lh3.googleusercontent.com/a/${googleUserId}?sz=150`,
      `https://lh3.googleusercontent.com/a/${googleUserId}?sz=96`
    ]

    console.log('🧪 Testing Google avatar URL formats...')

    for (const format of formats) {
      try {
        const response = await fetch(format, { method: 'HEAD' })
        if (response.ok) {
          console.log('✅ Working format found:', format)
          return format
        }
      } catch (error: unknown) {
        console.log('❌ Format failed:', format, error)
        console.log('❌ Format failed:', format)
      }
    }

    console.log('❌ No working format found')
    return null
  }

  /**
   * Generate MD5 hash for Gravatar using a simple implementation
   */
  static generateMD5Hash(str: string): string {
    // Simple MD5 implementation for Gravatar
    // This is a basic implementation - for production, consider using a proper MD5 library
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Convert to hex and ensure it's 32 characters
    const hashHex = Math.abs(hash).toString(16).padStart(8, '0')
    return hashHex + hashHex + hashHex + hashHex // Repeat to make it 32 chars
  }
}

 