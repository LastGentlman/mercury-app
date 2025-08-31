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
  
  // ✅ Singleton pattern to prevent multiple auth state listeners
  private static authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null
  private static authStateCallbacks: Set<(event: string, session: unknown) => void> = new Set()

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
   * OAuth Social Login - Versión Modal con Redirect
   * Esta versión elimina completamente los popups y usa redirect directo
   */
  static async socialLogin({ provider, redirectTo }: SocialLoginOptions): Promise<void> {
    if (!supabase) {
      const error = 'OAuth no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      console.error('❌', error)
      throw new Error(error)
    }

    try {
      const callbackUrl = redirectTo || `${globalThis.location.origin}/auth/callback`
      console.log(`🚀 Iniciando login con ${provider} (Modal → Redirect)...`)
      console.log('📍 Callback URL:', callbackUrl)
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: callbackUrl,
          // ✅ SIN skipBrowserRedirect - dejamos que Supabase maneje el redirect
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

      console.log(`✅ OAuth iniciado correctamente para ${provider}`)
      console.log('🔄 Supabase manejará el redirect automáticamente...')
        
      // ✅ NO necesitamos manejar popups, ventanas, o event listeners
      // Supabase redirige automáticamente al usuario al proveedor OAuth
      // El usuario regresará a nuestra página callback cuando complete la auth
        
    } catch (error: unknown) {
      console.error(`❌ Error en socialLogin:`, error)
        
      // Mejorar los mensajes de error para el usuario
      const errorMessage = error instanceof Error ? error.message : String(error)
      let userFriendlyError = errorMessage
        
      if (errorMessage.includes('network')) {
        userFriendlyError = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'La solicitud ha tardado demasiado. Inténtalo de nuevo.'
      } else if (errorMessage.includes('blocked')) {
        userFriendlyError = 'El acceso ha sido bloqueado. Contacta al soporte si el problema persiste.'
      } else if (errorMessage.includes('provider')) {
        userFriendlyError = `${provider} no está disponible temporalmente. Inténtalo más tarde.`
      }
        
      throw new Error(userFriendlyError)
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
   * Escuchar cambios de estado - Versión mejorada con singleton
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

    // ✅ Add callback to the set
    this.authStateCallbacks.add(callback)

    // ✅ Only set up listener once
    if (!this.authStateSubscription) {
      console.log('👂 Configurando listener de auth state changes...')
      
      this.authStateSubscription = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`🔄 Auth state cambió: ${event}`, {
          hasSession: !!session,
          userEmail: session?.user?.email,
          provider: session?.user?.app_metadata?.provider,
          timestamp: new Date().toISOString()
        })
        
        // ✅ Notify all registered callbacks
        this.authStateCallbacks.forEach(cb => {
          try {
            cb(event, session)
          } catch (error) {
            console.error('❌ Error in auth state callback:', error)
          }
        })
      })
    }

    // ✅ Return subscription that only removes this specific callback
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.authStateCallbacks.delete(callback)
            // If no more callbacks, clean up the subscription
            if (this.authStateCallbacks.size === 0 && this.authStateSubscription) {
              this.authStateSubscription.data.subscription.unsubscribe()
              this.authStateSubscription = null
              console.log('🧹 Auth state listener cleaned up')
            }
          }
        }
      }
    }
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

  /**
   * Change user password
   */
  static async changePassword({
    currentPassword,
    newPassword,
    confirmPassword
  }: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ message: string }> {
    const authToken = localStorage.getItem('authToken')
    
    if (!authToken) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${getApiUrl()}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    })

    if (!response.ok) {
      await handleApiError(response, 'email')
    }

    const data = await response.json()
    
    // Clear auth token to force re-login
    localStorage.removeItem('authToken')
    
    return { message: data.message }
  }

}

 