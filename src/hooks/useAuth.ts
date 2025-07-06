import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BACKEND_URL } from '../config'

import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface RegistrationResponse {
  message: string
  user: any
  emailConfirmationRequired?: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })
  const queryClient = useQueryClient()

  // Helper function to translate error messages to Spanish
  const translateErrorMessage = (message: string): string => {
    const errorTranslations: Record<string, string> = {
      'User with this email already exists.': 'Ya existe una cuenta con este email.',
      'already registered': 'Ya existe una cuenta con este email.',
      'User already registered': 'Ya existe una cuenta con este email.',
      'Invalid email': 'Email inválido.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'Registration failed': 'Error en el registro. Por favor intenta de nuevo.',
      'Login failed': 'Error en el inicio de sesión. Por favor intenta de nuevo.',
      'Invalid credentials': 'Credenciales inválidas.',
      'Email not confirmed': 'Email no confirmado. Por favor verifica tu email y haz clic en el enlace de confirmación antes de iniciar sesión.',
      'Email not confirmed. Please check your email and click the confirmation link before logging in.': 'Email no confirmado. Por favor verifica tu email y haz clic en el enlace de confirmación antes de iniciar sesión.',
      'Invalid email or password. Please check your credentials and try again.': 'Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta de nuevo.',
      'Too many requests': 'Demasiados intentos. Por favor espera un momento.',
      'Network error': 'Error de conexión. Verifica tu internet.',
      'Server error': 'Error del servidor. Por favor intenta más tarde.'
    }

    // Check for exact matches first
    if (errorTranslations[message]) {
      return errorTranslations[message]
    }

    // Check for partial matches
    for (const [key, translation] of Object.entries(errorTranslations)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return translation
      }
    }

    // Return original message if no translation found
    return message
  }

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      // Verify token and get user profile
      fetchUserProfile()
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState({
          user: data.profile,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken')
        setAuthState({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      localStorage.removeItem('authToken')
      setAuthState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        let errorMessage = 'Error en el inicio de sesión. Por favor intenta de nuevo.'
        
        try {
          const errorData = await response.json()
          // Handle different error response structures
          if (errorData.error) {
            errorMessage = translateErrorMessage(errorData.error)
          } else if (errorData.message) {
            errorMessage = translateErrorMessage(errorData.message)
          } else if (typeof errorData === 'string') {
            errorMessage = translateErrorMessage(errorData)
          }
        } catch (parseError) {
          console.error('❌ Failed to parse login error response as JSON:', parseError)
          // If we can't parse the JSON, use status text
          errorMessage = response.statusText || `Error HTTP ${response.status}: Error en el inicio de sesión`
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.session?.access_token) {
        localStorage.setItem('authToken', data.session.access_token)
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        })
      }
    }
  })

  const register = useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string }) => {
      console.log('🔄 Sending registration request:', { email: userData.email, name: userData.name })
      
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      console.log('📡 Registration response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        let errorMessage = 'Error en el registro. Por favor intenta de nuevo.'
        
        try {
          const errorData = await response.json()
          console.log('❌ Error response data:', errorData)
          
          // Handle different error response structures
          if (errorData.error) {
            errorMessage = translateErrorMessage(errorData.error)
          } else if (errorData.message) {
            errorMessage = translateErrorMessage(errorData.message)
          } else if (typeof errorData === 'string') {
            errorMessage = translateErrorMessage(errorData)
          }
        } catch (parseError) {
          console.error('❌ Failed to parse registration error response as JSON:', parseError)
          // If we can't parse the JSON, use status text
          errorMessage = response.statusText || `Error HTTP ${response.status}: Error en el registro`
        }
        
        console.log('🚨 Throwing error:', errorMessage)
        throw new Error(errorMessage)
      }

      const successData = await response.json()
      console.log('✅ Registration success data:', successData)
      return successData as Promise<RegistrationResponse>
    },
    onSuccess: (data) => {
      // Registration successful but user needs to confirm email
      // Don't set authentication state yet, user needs to confirm email first
      console.log('Registration successful:', data.message)
    }
  })

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = 'Logout failed'
        
        try {
          const errorData = await response.json()
          // Handle different error response structures
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
        } catch (parseError) {
          // If we can't parse the JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}: Logout failed`
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      localStorage.removeItem('authToken')
      setAuthState({ user: null, isAuthenticated: false, isLoading: false })
      queryClient.clear() // Clear all queries
    }
  })

  // Function to resend confirmation email
  const resendConfirmationEmail = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${BACKEND_URL}/api/auth/resend-confirmation`, {
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

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    resendConfirmationEmail,
    refetchUser: fetchUserProfile
  }
} 