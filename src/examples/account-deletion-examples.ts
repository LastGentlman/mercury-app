/**
 * Account Deletion Examples
 * 
 * This file demonstrates how to use the improved account deletion system
 * with multiple deletion methods and options.
 */

import { AccountDeletionService } from '../services/account-deletion-service.ts'

// Example 1: Immediate account deletion (recommended for most cases)
export async function deleteAccountImmediate() {
  try {
    const result = await AccountDeletionService.initiateAccountDeletion({
      immediate: true,
      reason: 'Usuario solicita eliminación inmediata'
    })
    
    console.log('✅ Account deleted immediately:', result)
    return result
  } catch (error) {
    console.error('❌ Error deleting account:', error)
    throw error
  }
}

// Example 2: Account deletion with grace period (default behavior)
export async function deleteAccountWithGracePeriod() {
  try {
    const result = await AccountDeletionService.initiateAccountDeletion({
      immediate: false,
      gracePeriodDays: 30, // 30 days instead of default 90
      reason: 'Usuario solicita eliminación con período de gracia'
    })
    
    console.log('✅ Account deletion initiated with grace period:', result)
    return result
  } catch (error) {
    console.error('❌ Error initiating account deletion:', error)
    throw error
  }
}

// Example 3: Using the SQL function directly (alternative approach)
export async function deleteAccountWithSQLFunction(userId: string) {
  try {
    const result = await AccountDeletionService.deleteUserAccountWithFunction(userId)
    
    if (result.success) {
      console.log('✅ Account deleted using SQL function')
    } else {
      console.error('❌ Error deleting account:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error deleting account:', error)
    throw error
  }
}

// Example 4: Using trigger-based deletion (simplest approach)
export async function deleteAccountWithTrigger(userId: string) {
  try {
    const result = await AccountDeletionService.deleteUserAccountWithTrigger(userId)
    
    if (result.success) {
      console.log('✅ Account deleted using trigger')
    } else {
      console.error('❌ Error deleting account:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error deleting account:', error)
    throw error
  }
}

// Example 5: Business deletion
export async function deleteBusiness(businessId: string) {
  try {
    const result = await AccountDeletionService.deleteBusiness(
      businessId, 
      'Usuario solicita eliminación del negocio'
    )
    
    console.log('✅ Business deleted:', result)
    return result
  } catch (error) {
    console.error('❌ Error deleting business:', error)
    throw error
  }
}

// Example 6: Business deletion using SQL function
export async function deleteBusinessWithSQLFunction(businessId: string) {
  try {
    const result = await AccountDeletionService.deleteBusinessWithFunction(businessId)
    
    if (result.success) {
      console.log('✅ Business deleted using SQL function')
    } else {
      console.error('❌ Error deleting business:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error deleting business:', error)
    throw error
  }
}

// Example 7: Check account deletion status
export async function checkAccountStatus(userId: string) {
  try {
    const status = await AccountDeletionService.checkAccountDeletionStatus(userId)
    
    console.log('📊 Account deletion status:', status)
    
    if (status.isDeleted) {
      if (status.isInGracePeriod) {
        console.log(`⏰ Account is in grace period. ${status.daysRemaining} days remaining.`)
        if (status.canCancel) {
          console.log('🔄 Account deletion can be cancelled')
        }
      } else {
        console.log('❌ Account deletion grace period has expired')
      }
    } else {
      console.log('✅ Account is active and not marked for deletion')
    }
    
    return status
  } catch (error) {
    console.error('❌ Error checking account status:', error)
    throw error
  }
}

// Example 8: Cancel account deletion during grace period
export async function cancelAccountDeletion(deletionLogId: string) {
  try {
    await AccountDeletionService.cancelAccountDeletion(deletionLogId)
    console.log('✅ Account deletion cancelled successfully')
  } catch (error) {
    console.error('❌ Error cancelling account deletion:', error)
    throw error
  }
}

// Example 9: Complete account deletion workflow
export async function completeAccountDeletionWorkflow() {
  try {
    // Step 1: Check current status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const status = await checkAccountStatus(user.id)
    
    if (status.isDeleted && status.isInGracePeriod) {
      // Step 2: Cancel existing deletion if in grace period
      if (status.deletionLogId) {
        await cancelAccountDeletion(status.deletionLogId)
        console.log('🔄 Previous deletion cancelled')
      }
    }
    
    // Step 3: Initiate new deletion (immediate)
    const result = await deleteAccountImmediate()
    
    console.log('✅ Complete account deletion workflow finished:', result)
    return result
    
  } catch (error) {
    console.error('❌ Error in complete workflow:', error)
    throw error
  }
}

// Example 10: Business deletion workflow
export async function completeBusinessDeletionWorkflow(businessId: string) {
  try {
    // Step 1: Delete business
    const result = await deleteBusiness(businessId)
    
    console.log('✅ Complete business deletion workflow finished:', result)
    return result
    
  } catch (error) {
    console.error('❌ Error in business deletion workflow:', error)
    throw error
  }
}

// Example 11: Using the suggested code patterns
export class ImprovedAccountDeletion {
  // Opción 1: Usar la función SQL personalizada
  static async deleteUserAccount(userId: string) {
    try {
      const result = await AccountDeletionService.deleteUserAccountWithFunction(userId)
      
      if (result.success) {
        console.log('✅ Account deleted successfully')
        return { success: true }
      } else {
        console.error('❌ Error deleting account:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }

  // Opción 2: Usar el trigger automático (más simple)
  static async deleteUserAccountWithTrigger(userId: string) {
    try {
      const result = await AccountDeletionService.deleteUserAccountWithTrigger(userId)
      
      if (result.success) {
        console.log('✅ Account deleted successfully with trigger')
        return { success: true }
      } else {
        console.error('❌ Error deleting account:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }

  // Función para eliminar business específico (bonus)
  static async deleteBusiness(businessId: string) {
    try {
      const result = await AccountDeletionService.deleteBusinessWithFunction(businessId)
      
      if (result.success) {
        console.log('✅ Business deleted successfully')
        return { success: true }
      } else {
        console.error('❌ Error deleting business:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Error:', error)
      return { success: false, error: 'Error inesperado' }
    }
  }
}

// Export all examples for easy testing
export const AccountDeletionExamples = {
  deleteAccountImmediate,
  deleteAccountWithGracePeriod,
  deleteAccountWithSQLFunction,
  deleteAccountWithTrigger,
  deleteBusiness,
  deleteBusinessWithSQLFunction,
  checkAccountStatus,
  cancelAccountDeletion,
  completeAccountDeletionWorkflow,
  completeBusinessDeletionWorkflow,
  ImprovedAccountDeletion
}
