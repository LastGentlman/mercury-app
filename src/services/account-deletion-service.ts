/**
 * Account Deletion Service - Simplified Version
 * 
 * Handles immediate account deletion without recovery system
 */

import { supabase } from '../utils/supabase.ts'
import { OAuthCleanup } from '../utils/oauth-cleanup.ts'
import type { AuthUser } from '../types/auth.ts'

export interface AccountDeletionRequest {
  reason?: string
}

export class AccountDeletionService {
  private static isDeleting = false;

  /**
   * Delete user account immediately
   */
  static async deleteAccount(request: AccountDeletionRequest = {}): Promise<{
    success: boolean
    message: string
  }> {
    // Prevent concurrent deletion requests
    if (this.isDeleting) {
      return {
        success: false,
        message: 'Account deletion already in progress'
      }
    }

    this.isDeleting = true;
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Call backend to delete account
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          reason: request.reason || 'User requested account deletion'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete account')
      }

      // Clean up local auth data
      await OAuthCleanup.aggressiveCleanup()

      return {
        success: true,
        message: 'Account deleted successfully'
      }

    } catch (error) {
      console.error('Error deleting account:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account'
      }
    } finally {
      this.isDeleting = false;
    }
  }

  /**
   * Check if account deletion is in progress (simplified - always returns false)
   */
  static async checkAccountDeletionStatus(_userId: string): Promise<{
    isDeleted: boolean
    isInGracePeriod: boolean
    canCancel: boolean
  }> {
    // Simplified: no grace period, no recovery
    return {
      isDeleted: false,
      isInGracePeriod: false,
      canCancel: false
    }
  }

  /**
   * Validate account status for authentication
   */
  static async validateAccountStatus(_user: AuthUser): Promise<{
    isValid: boolean
    message?: string
  }> {
    try {
      // For now, all accounts are considered valid
      // This can be extended to check for deleted accounts, suspended accounts, etc.
      return {
        isValid: true
      }
    } catch (error) {
      console.error('Error validating account status:', error)
      return {
        isValid: false,
        message: 'Account validation failed'
      }
    }
  }
}