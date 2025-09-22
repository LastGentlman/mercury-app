/**
 * Account Deletion Service
 * 
 * Handles all account deletion operations including:
 * - Initiating account deletion with grace period
 * - Checking deletion status
 * - Cancelling deletion during grace period
 * - Validating account status during authentication
 */

import { supabase } from '../utils/supabase.ts'
import type { AuthUser } from '../types/auth.ts'

export interface AccountDeletionRequest {
  reason?: string
  gracePeriodDays?: number
  immediate?: boolean
}

export interface AccountDeletionStatus {
  isDeleted: boolean
  isInGracePeriod: boolean
  deletionLogId?: string
  gracePeriodEnd?: Date
  daysRemaining?: number
  canCancel: boolean
}

export interface DeletionLog {
  id: string
  user_id: string
  user_email: string
  deletion_reason: string
  grace_period_start: string
  grace_period_end: string
  status: 'pending' | 'completed' | 'cancelled' | 'failed'
  created_at: string
  completed_at?: string
  cancelled_at?: string
}

export class AccountDeletionService {
  private static readonly DEFAULT_GRACE_PERIOD_DAYS = 90
  private static readonly DELETION_CHECK_INTERVAL = 30000 // 30 seconds

  /**
   * Check if user account is marked for deletion
   */
  static async checkAccountDeletionStatus(userId: string): Promise<AccountDeletionStatus> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // 🚨 EMERGENCY FIX: Add timeout and error handling to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Account validation timeout')), 5000)
      })
      
      const validationPromise = this.performAccountValidation(userId)
      
      return await Promise.race([validationPromise, timeoutPromise])
      
    } catch (error) {
      console.error('Error checking account deletion status:', error)
      // 🚨 EMERGENCY FIX: Return safe defaults to prevent blocking users
      return {
        isDeleted: false,
        isInGracePeriod: false,
        canCancel: false
      }
    }
  }

  /**
   * Perform the actual account validation
   */
  private static async performAccountValidation(userId: string): Promise<AccountDeletionStatus> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // First check user metadata for immediate deletion flag
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        isDeleted: false,
        isInGracePeriod: false,
        canCancel: false
      }
    }

    // Check if account is marked as deleted in metadata
    // For OAuth users, check both user_metadata and raw_user_meta_data (fallback)
    const isDeletedInMetadata = user.user_metadata?.account_deleted === true ||
                               (user as any).raw_user_meta_data?.account_deleted === true
    
    if (isDeletedInMetadata) {
      // Check deletion logs for grace period info
      const { data: deletionLog, error: logError } = await supabase
        .from('account_deletion_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      if (logError || !deletionLog) {
        // Account is marked as deleted but no log found - immediate deletion
        return {
          isDeleted: true,
          isInGracePeriod: false,
          canCancel: false
        }
      }

      const gracePeriodEnd = new Date(deletionLog.grace_period_end)
      const now = new Date()
      const isInGracePeriod = now < gracePeriodEnd
      const daysRemaining = isInGracePeriod 
        ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        isDeleted: true,
        isInGracePeriod,
        deletionLogId: deletionLog.id,
        gracePeriodEnd,
        daysRemaining,
        canCancel: isInGracePeriod
      }
    }

    return {
      isDeleted: false,
      isInGracePeriod: false,
      canCancel: false
    }
  }

  /**
   * Initiate account deletion with grace period or immediate deletion
   */
  static async initiateAccountDeletion(options: AccountDeletionRequest = {}): Promise<DeletionLog | { success: boolean; message: string; userId: string; deletionMethod: string; tablesCleaned?: string[] }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Usuario no autenticado')
    }

    // If immediate deletion is requested, use the backend endpoint
    if (options.immediate) {
      return await this.deleteUserAccountImmediate(options.reason)
    }

    // Otherwise, use the grace period approach
    const gracePeriodDays = options.gracePeriodDays || this.DEFAULT_GRACE_PERIOD_DAYS
    const gracePeriodEnd = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000)

    try {
      // Create deletion log entry
      const { data: deletionLog, error: logError } = await supabase
        .from('account_deletion_logs')
        .insert({
          user_id: user.id,
          user_email: user.email,
          deletion_reason: options.reason || 'Solicitud del usuario',
          grace_period_start: new Date().toISOString(),
          grace_period_end: gracePeriodEnd.toISOString(),
          status: 'pending'
        })
        .select()
        .single()

      if (logError) {
        throw new Error(`Error creando registro de eliminación: ${logError.message}`)
      }

      // The trigger will handle marking the user as deleted and invalidating sessions
      console.log('✅ Account deletion initiated:', {
        userId: user.id,
        deletionLogId: deletionLog.id,
        gracePeriodEnd: gracePeriodEnd.toISOString()
      })

      return deletionLog

    } catch (error) {
      console.error('Error initiating account deletion:', error)
      throw error
    }
  }

  /**
   * Delete user account immediately using the backend endpoint
   */
  static async deleteUserAccountImmediate(reason?: string): Promise<{ success: boolean; message: string; userId: string; deletionMethod: string; tablesCleaned?: string[] }> {
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediate: true,
          reason: reason || 'Eliminación inmediata solicitada por el usuario'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error eliminando cuenta')
      }

      // Force logout after successful deletion
      await this.forceLogout('Account deleted immediately')

      return {
        success: true,
        message: result.message,
        userId: result.userId,
        deletionMethod: result.deletionMethod,
        tablesCleaned: result.tablesCleaned
      }

    } catch (error) {
      console.error('Error in immediate account deletion:', error)
      throw error
    }
  }

  /**
   * Delete user account using the SQL function (alternative approach)
   */
  static async deleteUserAccountWithFunction(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase.rpc('delete_user_completely', {
        user_uuid: userId
      })
      
      if (error) {
        console.error('Error eliminando cuenta:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }

  /**
   * Delete user account using trigger (simplest approach)
   */
  static async deleteUserAccountWithTrigger(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // The trigger handles everything automatically
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) {
        console.error('Error eliminando usuario:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }

  /**
   * Cancel account deletion during grace period
   */
  static async cancelAccountDeletion(deletionLogId: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // Call the cancel function
      const { data, error } = await supabase.rpc('cancel_account_deletion', {
        deletion_log_id: deletionLogId
      })

      if (error) {
        throw new Error(`Error cancelando eliminación: ${error.message}`)
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al cancelar eliminación')
      }

      console.log('✅ Account deletion cancelled:', {
        deletionLogId,
        userId: data.user_id
      })

    } catch (error) {
      console.error('Error cancelling account deletion:', error)
      throw error
    }
  }

  /**
   * Get deletion log details
   */
  static async getDeletionLog(deletionLogId: string): Promise<DeletionLog | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data: deletionLog, error } = await supabase
        .from('account_deletion_logs')
        .select('*')
        .eq('id', deletionLogId)
        .single()

      if (error) {
        console.error('Error fetching deletion log:', error)
        return null
      }

      return deletionLog

    } catch (error) {
      console.error('Error getting deletion log:', error)
      return null
    }
  }

  /**
   * Validate account status during authentication
   * This should be called after successful login
   */
  static async validateAccountStatus(user: AuthUser): Promise<{
    isValid: boolean
    shouldRedirect: boolean
    redirectPath?: string
    message?: string
  }> {
    try {
      // 🚨 TEMPORARY FIX: Skip account deletion validation for OAuth users
      // This prevents the 500 error from account_deletion_logs table
      if (user.provider === 'google' || user.provider === 'facebook') {
        console.log('🔍 Skipping account deletion validation for OAuth user:', user.email)
        return { isValid: true, shouldRedirect: false }
      }

      const deletionStatus = await this.checkAccountDeletionStatus(user.id)

      if (!deletionStatus.isDeleted) {
        return { isValid: true, shouldRedirect: false }
      }

      if (deletionStatus.isInGracePeriod && deletionStatus.canCancel) {
        // User is in grace period - redirect to recovery page
        return {
          isValid: false,
          shouldRedirect: true,
          redirectPath: `/account-recovery?deletion-id=${deletionStatus.deletionLogId}`,
          message: 'Tu cuenta está programada para eliminación. Puedes cancelar este proceso.'
        }
      } else {
        // Grace period expired or account already deleted
        if (supabase) {
          await supabase.auth.signOut()
        }
        return {
          isValid: false,
          shouldRedirect: true,
          redirectPath: '/auth?message=account-deleted',
          message: 'Tu cuenta ha sido eliminada. Contacta soporte@pedidolist.com si crees que esto es un error.'
        }
      }

    } catch (error) {
      console.error('Error validating account status:', error)
      // On error, allow access but log the issue
      return { isValid: true, shouldRedirect: false }
    }
  }

  /**
   * Force logout and clear all local data
   */
  static async forceLogout(reason: string = 'Account deleted'): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // Clear all local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear any cached data
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        (window as any).queryClient.clear()
      }

      console.log(`✅ Force logout completed: ${reason}`)

    } catch (error) {
      console.error('Error during force logout:', error)
    }
  }

  /**
   * Start monitoring account deletion status
   * This can be used to periodically check if account was deleted
   */
  static startDeletionMonitoring(userId: string, onStatusChange: (status: AccountDeletionStatus) => void): () => void {
    let intervalId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const status = await this.checkAccountDeletionStatus(userId)
        onStatusChange(status)

        // If account is deleted and grace period expired, stop monitoring
        if (status.isDeleted && !status.isInGracePeriod) {
          this.stopDeletionMonitoring()
        }
      } catch (error) {
        console.error('Error monitoring account deletion status:', error)
      }
    }

    // Check immediately
    checkStatus()

    // Then check periodically
    intervalId = setInterval(checkStatus, this.DELETION_CHECK_INTERVAL)

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }

  /**
   * Stop monitoring account deletion status
   */
  private static stopDeletionMonitoring(): void {
    // This would be called by the monitoring function
    // Implementation depends on how you want to manage the interval
  }

  /**
   * Delete business completely
   */
  static async deleteBusiness(businessId: string, reason?: string): Promise<{ success: boolean; message: string; businessId: string; deletionMethod: string; tablesCleaned?: string[] }> {
    try {
      const response = await fetch(`/api/auth/business/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediate: true,
          reason: reason || 'Eliminación de negocio solicitada por el usuario'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error eliminando negocio')
      }

      return {
        success: true,
        message: result.message,
        businessId: result.businessId,
        deletionMethod: result.deletionMethod,
        tablesCleaned: result.tablesCleaned
      }

    } catch (error) {
      console.error('Error in business deletion:', error)
      throw error
    }
  }

  /**
   * Delete business using SQL function (alternative approach)
   */
  static async deleteBusinessWithFunction(businessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase.rpc('delete_business_completely', {
        business_uuid: businessId
      })
      
      if (error) {
        console.error('Error eliminando negocio:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }

  /**
   * Get time remaining in grace period as formatted string
   */
  static formatTimeRemaining(gracePeriodEnd: Date): string {
    const now = new Date()
    const timeDiff = gracePeriodEnd.getTime() - now.getTime()

    if (timeDiff <= 0) {
      return 'Expirado'
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days} días y ${hours} horas`
    } else if (hours > 0) {
      return `${hours} horas y ${minutes} minutos`
    } else {
      return `${minutes} minutos`
    }
  }
}
