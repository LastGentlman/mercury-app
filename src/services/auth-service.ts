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
      
      // 🔍 DEBUG - Raw user metadata para troubleshooting
      console.log('🔍 DEBUG - Raw user metadata:', {
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        identities: user.identities?.[0]?.identity_data
      });

      console.log('🖼️ DEBUG - Avatar URLs disponibles:', {
        avatar_url: user.user_metadata?.avatar_url,
        picture: user.user_metadata?.picture,
        identity_picture: user.identities?.[0]?.identity_data?.picture,
        identity_avatar_url: user.identities?.[0]?.identity_data?.avatar_url
      });

      // 🔍 DEBUG - Complete user object for deep inspection
      console.log('🔍 DEBUG - Complete user object:', JSON.stringify(user, null, 2));

      // Try to get avatar URL from OAuth data first
      let avatarUrl = user.user_metadata?.picture || 
                     user.user_metadata?.avatar_url ||
                     user.identities?.[0]?.identity_data?.picture ||
                     user.identities?.[0]?.identity_data?.avatar_url

      // If no avatar URL and it's Google OAuth, try to fetch from Google People API
      if (!avatarUrl && user.app_metadata?.provider === 'google' && session.access_token) {
        console.log('🔄 No avatar URL found in OAuth data, trying Google People API...')
        try {
          avatarUrl = await this.fetchGoogleProfilePicture(session.access_token)
        } catch (error) {
          console.error('❌ Error fetching Google profile picture:', error)
          
          // If we get 401, it means the access token doesn't have People API scope
          // We need to force a re-authentication with the correct scopes
          if (error instanceof Error && error.message.includes('401')) {
            console.log('🔄 401 error detected - access token missing People API scope')
            console.log('🔄 User needs to re-authenticate with updated scopes')
            
            // Store a flag to indicate re-authentication is needed
            localStorage.setItem('google_avatar_reauth_needed', 'true')
          } else if (error instanceof Response && error.status === 401) {
            console.log('🔄 401 error detected - access token missing People API scope')
            console.log('🔄 User needs to re-authenticate with updated scopes')
            
            // Store a flag to indicate re-authentication is needed
            localStorage.setItem('google_avatar_reauth_needed', 'true')
          } else {
            // For any other error, also set the flag as a precaution
            console.log('🔄 Error detected - setting re-authentication flag')
            localStorage.setItem('google_avatar_reauth_needed', 'true')
          }
        }
      }

      // Fallback: Construct Google avatar URL directly using user ID
      if (!avatarUrl && user.app_metadata?.provider === 'google') {
        const googleUserId = user.user_metadata?.provider_id || user.identities?.[0]?.id
        if (googleUserId) {
          console.log('🔄 Constructing Google avatar URL directly using user ID:', googleUserId)
          
          // Test different formats to find one that works
          try {
            const workingFormat = await this.testGoogleAvatarFormats(googleUserId)
            if (workingFormat) {
              avatarUrl = workingFormat
              console.log('✅ Using working Google avatar URL:', avatarUrl)
            } else {
              // Fallback to Gravatar using email
              const email = user.email || user.user_metadata?.email
              if (email) {
                const gravatarHash = await this.generateMD5Hash(email.toLowerCase().trim())
                avatarUrl = `https://www.gravatar.com/avatar/${gravatarHash}?s=150&d=identicon`
                console.log('⚠️ Using Gravatar fallback:', avatarUrl)
              } else {
                // Final fallback to default Google format
                avatarUrl = `https://lh3.googleusercontent.com/-${googleUserId}/photo?sz=150`
                console.log('⚠️ Using fallback Google avatar URL:', avatarUrl)
              }
            }
          } catch (error) {
            console.error('❌ Error testing avatar formats:', error)
            // Fallback to Gravatar using email
            const email = user.email || user.user_metadata?.email
            if (email) {
              const gravatarHash = await this.generateMD5Hash(email.toLowerCase().trim())
              avatarUrl = `https://www.gravatar.com/avatar/${gravatarHash}?s=150&d=identicon`
              console.log('⚠️ Using Gravatar fallback:', avatarUrl)
            } else {
              // Final fallback to default Google format
              avatarUrl = `https://lh3.googleusercontent.com/-${googleUserId}/photo?sz=150`
              console.log('⚠️ Using fallback Google avatar URL:', avatarUrl)
            }
          }
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
   * OAuth Social Login - Versión mejorada con debugging
   */
  static async socialLogin({ provider, redirectTo }: SocialLoginOptions): Promise<void> {
    if (!supabase) {
      const error = 'OAuth no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      console.error('❌', error)
      throw new Error(error)
    }

    try {
      const callbackUrl = redirectTo || `${globalThis.location.origin}/auth/callback`
      console.log(`🚀 Iniciando login con ${provider}...`)
      console.log('📍 Redirect URL:', callbackUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile'
          } : {},
          scopes: provider === 'google' 
            ? 'openid email profile https://www.googleapis.com/auth/userinfo.profile'
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
   * This is used when OAuth doesn't provide the picture directly
   */
  static async fetchGoogleProfilePicture(accessToken: string): Promise<string | null> {
    try {
      console.log('🔄 Fetching Google profile picture via People API...')
      
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me?personFields=photos',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.error('❌ Google People API error:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      console.log('📊 Google People API response:', data)

      // Get the first profile photo
      const photos = data.photos?.[0]
      if (photos?.url) {
        console.log('✅ Google profile picture found:', photos.url)
        return photos.url
      }

      console.log('⚠️ No profile picture found in Google People API')
      return null
    } catch (error) {
      console.error('❌ Error fetching Google profile picture:', error)
      return null
    }
  }

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
      } catch (error) {
        console.log('❌ Format failed:', format)
      }
    }

    console.log('❌ No working format found')
    return null
  }

  /**
   * Generate MD5 hash for Gravatar
   */
  static async generateMD5Hash(str: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }
}

 