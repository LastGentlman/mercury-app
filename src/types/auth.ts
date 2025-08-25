/**
 * Authentication-related type definitions
 * Updated to match TanStack Query mutation objects and test expectations
 */

import type { UseMutationResult } from '@tanstack/react-query'

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

/**
 * Complete return type for useAuth hook
 * Includes both mutation objects and convenience methods
 */
export interface AuthHookReturn extends AuthState {
  // Mutation objects (full TanStack Query mutations with all properties)
  login: UseMutationResult<LoginResponse, Error, LoginCredentials>
  register: UseMutationResult<RegistrationResponse, Error, RegisterCredentials>
  logout: UseMutationResult<void, Error, void>
  resendConfirmationEmail: UseMutationResult<void, Error, string>
  changeEmail: UseMutationResult<{ newEmail: string }, Error, { currentEmail: string; newEmail: string }>
  socialLogin: UseMutationResult<void, Error, SocialLoginOptions>
  
  // Utility functions
  refetchUser: () => Promise<AuthUser | null>
  
  // OAuth convenience methods
  loginWithGoogle: () => void
  loginWithFacebook: () => void
  
  // Loading states (convenience accessors)
  isLoginLoading: boolean
  isRegisterLoading: boolean
  isLogoutLoading: boolean
  isSocialLoginLoading: boolean
} 