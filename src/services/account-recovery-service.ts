/**
 * Account Recovery Service
 * Handles account recovery operations for deleted accounts
 */

import { env } from '../env'

export interface AccountRecoveryStatus {
  canRecover: boolean
  daysRemaining?: number
  gracePeriodEnd?: string
  message: string
}

export interface RecoveryResponse {
  success: boolean
  message: string
  userId?: string
  gracePeriodRemaining?: string
}

/**
 * Gets the API base URL from environment
 */
function getApiUrl(): string {
  return env.VITE_BACKEND_URL || 'http://localhost:3030'
}

export class AccountRecoveryService {
  /**
   * Check if an account can be recovered
   */
  static async checkRecoveryStatus(email: string): Promise<AccountRecoveryStatus> {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/account/recovery-status/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            canRecover: false,
            message: 'No se encontró una cuenta eliminada con este email.'
          }
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      return {
        canRecover: data.can_recover,
        daysRemaining: data.days_remaining,
        gracePeriodEnd: data.grace_period_end,
        message: data.message
      }
    } catch (error) {
      console.error('Error checking recovery status:', error)
      return {
        canRecover: false,
        message: 'Error al verificar el estado de recuperación.'
      }
    }
  }

  /**
   * Recover a deleted account
   */
  static async recoverAccount(email: string): Promise<RecoveryResponse> {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/account/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Recovery failed')
      }

      return {
        success: true,
        message: data.message,
        userId: data.user_id,
        gracePeriodRemaining: data.grace_period_remaining
      }
    } catch (error) {
      console.error('Error recovering account:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al recuperar la cuenta.'
      }
    }
  }

  /**
   * Parse error metadata from token validation
   */
  static parseErrorMetadata(error: any): {
    canRecover: boolean
    daysRemaining?: number
    gracePeriodEnd?: string
    deletionLogId?: string
  } {
    // Try multiple possible metadata locations
    const metadata = error?.metadata ||
                    error?.response?.data?.metadata ||
                    error?.data?.metadata ||
                    {}

    return {
      canRecover: metadata.canRecover === true,
      daysRemaining: metadata.daysRemaining,
      gracePeriodEnd: metadata.gracePeriodEnd,
      deletionLogId: metadata.deletionLogId
    }
  }
}