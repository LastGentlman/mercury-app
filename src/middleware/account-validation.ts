/**
 * Account Validation Middleware
 * 
 * Validates account deletion status and handles redirects for deleted accounts
 * This should be integrated into the authentication flow
 */

import { useCallback } from 'react'
import { AccountDeletionService } from '../services/account-deletion-service.ts'
import type { AuthUser } from '../types/auth.ts'

export interface AccountValidationResult {
  isValid: boolean
  shouldRedirect: boolean
  redirectPath?: string
  message?: string
  deletionStatus?: {
    isDeleted: boolean
    isInGracePeriod: boolean
    daysRemaining?: number
    canCancel: boolean
    canRecover: boolean
    recoveryAvailable: boolean
  }
}

export class AccountValidationMiddleware {
  private   static readonly EXCLUDED_PATHS = [
    '/auth',
    '/auth/callback',
    '/account-recovery',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/profile' // Add profile page to excluded paths to prevent validation loops
  ]

  /**
   * Validate account status for a user
   */
  static async validateAccount(user: AuthUser | null, currentPath: string): Promise<AccountValidationResult> {
    // If no user, allow access to auth pages
    if (!user) {
      return { isValid: true, shouldRedirect: false }
    }

    // Skip validation for excluded paths
    if (this.EXCLUDED_PATHS.some(path => currentPath.startsWith(path))) {
      return { isValid: true, shouldRedirect: false }
    }

    // ✅ IMPROVED: Better path exclusions and OAuth user handling
    // Note: These paths should NOT be excluded from validation - they need validation
    // Only auth-related paths should be excluded
    console.log('🔍 Account validation proceeding for protected route:', currentPath)

    // ✅ IMPROVED: Handle OAuth users more gracefully
    if (user.provider === 'google' || user.provider === 'facebook') {
      console.log('🔍 OAuth user detected, using simplified validation:', user.email)
      // For OAuth users, only check if they're explicitly marked as deleted
      // Skip complex deletion log checks that might cause issues
      try {
        const isDeletedInMetadata = (user as any).user_metadata?.account_deleted === true ||
                                   (user as any).raw_user_meta_data?.account_deleted === true
        
        if (isDeletedInMetadata) {
          console.log('⚠️ OAuth user marked as deleted in metadata:', user.email)
          return {
            isValid: false,
            shouldRedirect: true,
            redirectPath: '/auth?message=account-deleted&recovery=unavailable',
            message: 'Tu cuenta ha sido eliminada. Puedes crear una nueva cuenta o contactar soporte@pedidolist.com si crees que esto es un error.'
          }
        }
        
        // OAuth user is valid
        return { isValid: true, shouldRedirect: false }
      } catch (error) {
        console.error('Error validating OAuth user:', error)
        // On error, allow OAuth users to proceed
        return { isValid: true, shouldRedirect: false }
      }
    }

    try {
      // Check account deletion status
      const deletionStatus = await AccountDeletionService.checkAccountDeletionStatus(user.id)

      if (!deletionStatus.isDeleted) {
        return { 
          isValid: true, 
          shouldRedirect: false,
          deletionStatus 
        }
      }

      // Account is marked for deletion
      if (deletionStatus.isInGracePeriod && deletionStatus.canCancel) {
        // User is in grace period - redirect to recovery page
        return {
          isValid: false,
          shouldRedirect: true,
          redirectPath: `/account-recovery?deletion-id=${deletionStatus.deletionLogId}`,
          message: 'Tu cuenta está programada para eliminación. Puedes cancelar este proceso.',
          deletionStatus
        }
      } else {
        // Grace period expired or account already deleted
        // Check if recovery is available
        if (deletionStatus.canRecover && deletionStatus.recoveryAvailable) {
          return {
            isValid: false,
            shouldRedirect: true,
            redirectPath: '/account-recovery?deleted=true',
            message: 'Tu cuenta ha sido eliminada, pero puedes solicitar su recuperación.',
            deletionStatus
          }
        } else {
          return {
            isValid: false,
            shouldRedirect: true,
            redirectPath: '/auth?message=account-deleted&recovery=unavailable',
            message: 'Tu cuenta ha sido eliminada. Puedes crear una nueva cuenta o contactar soporte@pedidolist.com si crees que esto es un error.',
            deletionStatus
          }
        }
      }

    } catch (error) {
      console.error('Error validating account status:', error)
      // On error, allow access but log the issue
      return { isValid: true, shouldRedirect: false }
    }
  }

  /**
   * Handle account validation result
   */
  static handleValidationResult(
    result: AccountValidationResult,
    onRedirect: (path: string) => void,
    onLogout?: () => void
  ): void {
    if (!result.shouldRedirect) {
      return
    }

    // If account is deleted and grace period expired, force logout
    if (result.deletionStatus?.isDeleted && !result.deletionStatus?.isInGracePeriod) {
      if (onLogout) {
        onLogout()
      }
    }

    // Redirect to appropriate page
    if (result.redirectPath) {
      onRedirect(result.redirectPath)
    }
  }

  /**
   * Create a hook for account validation
   */
  static createValidationHook() {
    return {
      validateAccount: this.validateAccount.bind(this),
      handleValidationResult: this.handleValidationResult.bind(this)
    }
  }
}

/**
 * React hook for account validation
 */
export function useAccountValidation() {
  const validateAccount = useCallback(async (user: AuthUser | null, currentPath: string): Promise<AccountValidationResult> => {
    return AccountValidationMiddleware.validateAccount(user, currentPath)
  }, [])

  const handleValidationResult = useCallback((
    result: AccountValidationResult,
    onRedirect: (path: string) => void,
    onLogout?: () => void
  ): void => {
    AccountValidationMiddleware.handleValidationResult(result, onRedirect, onLogout)
  }, [])

  return {
    validateAccount,
    handleValidationResult
  }
}
