/**
 * Authentication-related type definitions
 */

export type AuthProvider = 'email' | 'google' | 'facebook'

export interface SocialLoginOptions {
  provider: 'google' | 'facebook'
  redirectTo?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface AuthSession {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export interface LoginResponse {
  message: string
  user: AuthUser
  session: AuthSession
}

export interface RegistrationResponse {
  message: string
  user: AuthUser
  emailConfirmationRequired?: boolean
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: AuthProvider
  businessId?: string
  role?: 'owner' | 'employee'
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  provider: AuthProvider
}

export interface AuthError extends Error {
  code?: string
  provider?: AuthProvider
}

export interface AuthHookReturn extends AuthState {
  // Traditional auth methods
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  register: (credentials: RegisterCredentials) => Promise<RegistrationResponse>
  logout: () => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<void>
  refetchUser: () => Promise<AuthUser | null>
  
  // OAuth methods
  loginWithGoogle: () => void
  loginWithFacebook: () => void
  socialLogin: (options: SocialLoginOptions) => Promise<any>
  
  // Loading states
  isLoginLoading: boolean
  isRegisterLoading: boolean
  isLogoutLoading: boolean
  isSocialLoginLoading: boolean
} 