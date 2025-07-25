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
import { handleApiError, createAuthError } from '../utils/auth-errors'
import { env } from '../env'

/**
 * Supabase client configuration
 * Only create client if environment variables are properly configured
 */
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Gets the API base URL from environment
 */
function getApiUrl(): string {
  return env.VITE_API_URL || 'http://localhost:3000'
}

export class AuthService {
  /**
   * Gets current user session from Supabase OAuth
   */
  static async getOAuthSession(): Promise<AuthUser | null> {
    if (!supabase) {
      // Supabase not configured, return null silently
      return null
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return null

      const supabaseUser = session.user
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || 
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split('@')[0] || '',
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        provider: (supabaseUser.app_metadata?.provider as any) || 'email'
      }
    } catch (error) {
      console.error('Error getting OAuth session:', error)
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
   * Performs social login via Supabase
   */
  static async socialLogin({ provider, redirectTo }: SocialLoginOptions) {
    if (!supabase) {
      throw createAuthError(
        'OAuth no está configurado. Por favor contacta al administrador.',
        'OAUTH_NOT_CONFIGURED',
        provider
      )
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent'
        } : {},
        scopes: provider === 'google' 
          ? 'openid email profile'
          : 'email public_profile'
      }
    })
    
    if (error) {
      throw createAuthError(error.message, error.name, provider)
    }
    
    return data
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
   * Logs out from both OAuth and traditional auth
   */
  static async logout(): Promise<void> {
    // Logout from Supabase OAuth
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.error('Supabase logout error:', error)
          }
        }
      } catch (error) {
        console.error('Error during Supabase logout:', error)
      }
    }

    // Logout from traditional auth
    const authToken = localStorage.getItem('authToken')
    if (authToken) {
      try {
        await fetch(`${getApiUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error('Traditional logout error:', error)
      }
    }
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
   * Gets Supabase auth state change subscription
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      // Return a dummy subscription object that matches Supabase's structure
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

 