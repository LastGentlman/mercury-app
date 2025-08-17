/**
 * Authentication error handling utilities
 */

import type { AuthError, AuthProvider } from '../types/auth.ts'

/**
 * Error message translations from English to Spanish
 */
const ERROR_TRANSLATIONS: Record<string, string> = {
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
  'Email not confirmed. Please check your email and click the confirmation link before logging in.': 
    'Email no confirmado. Por favor verifica tu email y haz clic en el enlace de confirmación antes de iniciar sesión.',
  'Invalid email or password. Please check your credentials and try again.': 
    'Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta de nuevo.',
  'Too many requests': 'Demasiados intentos. Por favor espera un momento.',
  'Server error': 'Error del servidor. Por favor intenta más tarde.'
} as const

/**
 * Translates error messages to Spanish
 */
export function translateErrorMessage(message: string): string {
  // Check for exact matches first
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message]
  }

  // Check for partial matches
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  // Return original message if no translation found
  return message
}

/**
 * Creates a standardized AuthError
 */
export function createAuthError(
  message: string, 
  code?: string, 
  provider?: AuthProvider
): AuthError {
  const error = new Error(translateErrorMessage(message)) as AuthError
  error.code = code || ''
  error.provider = provider || 'email'
  return error
}

/**
 * Handles API response errors consistently
 */
export async function handleApiError(
  response: Response,
  provider?: AuthProvider
): Promise<never> {
  let errorMessage = 'Error durante la operación. Por favor intenta de nuevo.'
  
  try {
    const errorData = await response.json()
    if (errorData.error) {
      errorMessage = errorData.error
    } else if (errorData.message) {
      errorMessage = errorData.message
    } else if (typeof errorData === 'string') {
      errorMessage = errorData
    }
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError)
    errorMessage = response.statusText || `Error HTTP ${response.status}: ${errorMessage}`
  }
  
  throw createAuthError(errorMessage, response.status.toString(), provider)
} 