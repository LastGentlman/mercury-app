// src/hooks/useAuth.ts - Versión mejorada que mantiene compatibilidad
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

// **NUEVAS** interfaces para OAuth
interface OAuthProvider {
  name: 'google' | 'facebook'
  displayName: string
}

interface SocialLoginOptions {
  provider: 'google' | 'facebook'
  redirectTo?: string
}

// Configuración de Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

// Interfaces existentes (mantener compatibilidad)
interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider?: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}

interface LoginResponse {
  message: string
  user: any
  session: any
}

interface RegistrationResponse {
  message: string
  user: any
}

// Función para traducir mensajes de error (mantener existente)
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'Email not confirmed': 'Email no confirmado. Revisa tu bandeja de entrada.',
    'Invalid login credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'User already registered': 'Ya existe una cuenta con este email.',
    'Email already exists': 'Ya existe una cuenta con este email.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Invalid email format': 'Formato de email inválido.',
    'Network error': 'Error de conexión. Verifica tu internet.',
    'Internal server error': 'Error interno del servidor. Intenta más tarde.',
    'User with this email already exists.': 'Ya existe una cuenta con este email.',
    'already registered': 'Ya existe una cuenta con este email.',
    'Invalid email': 'Email inválido.',
    'Registration failed': 'Error en el registro. Por favor intenta de nuevo.',
    'Login failed': 'Error en el inicio de sesión. Por favor intenta de nuevo.',
    'Invalid credentials': 'Credenciales inválidas.',
    'Email not confirmed. Please check your email and click the confirmation link before logging in.': 'Email no confirmado. Por favor verifica tu email y haz clic en el enlace de confirmación antes de iniciar sesión.',
    'Invalid email or password. Please check your credentials and try again.': 'Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta de nuevo.',
    'Too many requests': 'Demasiados intentos. Por favor espera un momento.',
    'Server error': 'Error del servidor. Por favor intenta más tarde.'
  }
  
  // Check for exact matches first
  if (translations[message]) {
    return translations[message]
  }

  // Check for partial matches
  for (const [key, translation] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  // Return original message if no translation found
  return message
}

export function useAuth() {
  const queryClient = useQueryClient()

  // Query para obtener el perfil del usuario (mantener existente)
  const { data: user, isLoading, refetch: refetchUser } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<User | null> => {
      // Primero verificar si hay sesión en Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Usuario autenticado via OAuth (Supabase)
        const supabaseUser = session.user
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name ||
                supabaseUser.email?.split('@')[0] || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          provider: supabaseUser.app_metadata?.provider || 'email'
        }
      }

      // Fallback al sistema tradicional (JWT en localStorage)
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return null

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          localStorage.removeItem('authToken')
          return null
        }

        const data = await response.json()
        return data.profile as User
      } catch (error) {
        console.error('Error fetching profile:', error)
        localStorage.removeItem('authToken')
        return null
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000
  })

  // **NUEVO**: Mutation para login con OAuth
  const socialLogin = useMutation({
    mutationFn: async ({ provider, redirectTo }: SocialLoginOptions) => {
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
      
      if (error) throw new Error(translateErrorMessage(error.message))
      return data
    },
    onSuccess: () => {
      // El redirect se maneja automáticamente por Supabase
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })

  // Mutation para login tradicional (mantener existente)
  const login = useMutation({
    mutationFn: async ({ email, password }: LoginCredentials): Promise<LoginResponse> => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      console.log('🔄 Sending login request to:', `${apiUrl}/api/auth/login`)
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        let errorMessage = 'Error durante el login. Por favor intenta de nuevo.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = translateErrorMessage(errorData.error)
          } else if (errorData.message) {
            errorMessage = translateErrorMessage(errorData.message)
          }
        } catch (parseError) {
          console.error('Failed to parse login error response:', parseError)
          errorMessage = response.statusText || `Error HTTP ${response.status}: Error en el login`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.session?.access_token) {
        localStorage.setItem('authToken', data.session.access_token)
      }
      
      return data as LoginResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })

  // Mutation para registro (mantener existente)
  const register = useMutation({
    mutationFn: async ({ email, password, name }: RegisterCredentials): Promise<RegistrationResponse> => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      console.log('🔄 Sending registration request to:', `${apiUrl}/api/auth/register`)
      
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        let errorMessage = 'Error durante el registro. Por favor intenta de nuevo.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = translateErrorMessage(errorData.error)
          } else if (errorData.message) {
            errorMessage = translateErrorMessage(errorData.message)
          }
        } catch (parseError) {
          console.error('Failed to parse registration error response:', parseError)
          errorMessage = response.statusText || `Error HTTP ${response.status}: Error en el registro`
        }
        
        throw new Error(errorMessage)
      }

      const successData = await response.json()
      return successData as RegistrationResponse
    },
    onSuccess: () => {
      // No invalidar queries aquí, el usuario debe confirmar email primero
    }
  })

  // Mutation para logout (mejorada para OAuth)
  const logout = useMutation({
    mutationFn: async () => {
      // Cerrar sesión en Supabase si existe
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { error } = await supabase.auth.signOut()
        if (error) console.error('Supabase logout error:', error)
      }

      // Cerrar sesión tradicional si existe token
      const authToken = localStorage.getItem('authToken')
      if (authToken) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
          await fetch(`${apiUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (error) {
          console.error('Traditional logout error:', error)
        }
        
        localStorage.removeItem('authToken')
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['user-profile'], null)
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })

  // Function to resend confirmation email (mantener existente)
  const resendConfirmationEmail = useMutation({
    mutationFn: async (email: string) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        let errorMessage = 'Error al reenviar el email de confirmación'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = translateErrorMessage(errorData.error)
          } else if (errorData.message) {
            errorMessage = translateErrorMessage(errorData.message)
          }
        } catch (parseError) {
          errorMessage = response.statusText || `Error HTTP ${response.status}: Error al reenviar email`
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    }
  })

  // **NUEVOS**: Métodos helper para OAuth
  const loginWithGoogle = () => socialLogin.mutate({ 
    provider: 'google',
    redirectTo: `${window.location.origin}/dashboard`
  })

  const loginWithFacebook = () => socialLogin.mutate({ 
    provider: 'facebook',
    redirectTo: `${window.location.origin}/dashboard`
  })

  // Efecto para manejar el callback de OAuth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('OAuth sign in detected')
          queryClient.invalidateQueries({ queryKey: ['user-profile'] })
        } else if (event === 'SIGNED_OUT') {
          console.log('OAuth sign out detected')
          queryClient.setQueryData(['user-profile'], null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [queryClient])

  return {
    // Estado (mantener compatibilidad)
    user,
    isAuthenticated: !!user,
    isLoading,
    
    // Métodos existentes (mantener compatibilidad)
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    refetchUser,
    resendConfirmationEmail,
    
    // **NUEVOS**: Métodos para OAuth
    loginWithGoogle,
    loginWithFacebook,
    socialLogin: socialLogin.mutateAsync,
    
    // Estados de carga (extendidos)
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending,
    isSocialLoginLoading: socialLogin.isPending,
    
    // **NUEVO**: Información del provider
    provider: user?.provider || 'email'
  }
} 