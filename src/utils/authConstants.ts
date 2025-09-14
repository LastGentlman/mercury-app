/**
 * Authentication constants
 * Centralizes magic numbers and strings
 */

export const AUTH_CONSTANTS = {
  REDIRECT: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 100,
    TIMEOUT_MS: 5000,
    THROTTLE_MS: 1000
  },
  ROUTES: {
    DASHBOARD: '/dashboard',
    AUTH: '/auth',
    AUTH_CALLBACK: '/auth/callback'
  },
  EVENTS: {
    THROTTLE_MS: 5000,
    INITIAL_SESSION: 'INITIAL_SESSION',
    SIGNED_IN: 'SIGNED_IN',
    SIGNED_OUT: 'SIGNED_OUT'
  },
  STORAGE: {
    AUTH_TOKEN_KEY: 'authToken'
  }
} as const

export type AuthEventType = typeof AUTH_CONSTANTS.EVENTS[keyof typeof AUTH_CONSTANTS.EVENTS]
