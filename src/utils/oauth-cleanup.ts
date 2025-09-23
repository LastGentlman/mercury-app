/**
 * OAuth Session Cleanup Utilities
 * 
 * Handles aggressive cleanup of OAuth sessions to prevent auto-login after account deletion
 */

import { supabase } from './supabase.ts'

export class OAuthCleanup {
  /**
   * Aggressive OAuth session cleanup
   * This prevents OAuth users from being automatically logged back in after account deletion
   */
  static async aggressiveCleanup(): Promise<void> {
    console.log('🧹 Starting aggressive OAuth cleanup...')
    
    try {
      // 1. Clear all browser storage
      localStorage.clear()
      sessionStorage.clear()
      
      // 2. Clear cookies
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      // 3. Multiple Supabase signOut attempts
      if (supabase) {
        for (let i = 0; i < 3; i++) {
          try {
            await supabase.auth.signOut()
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.log(`SignOut attempt ${i + 1} failed:`, error)
          }
        }
      }
      
      // 4. Clear any cached query data
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        (window as any).queryClient.clear()
      }
      
      // 5. Clear any remaining auth state
      if (typeof window !== 'undefined') {
        // Clear any remaining Supabase auth state
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth') || key.includes('sb-')
        )
        authKeys.forEach(key => localStorage.removeItem(key))
      }
      
      console.log('✅ Aggressive OAuth cleanup completed')
      
    } catch (error) {
      console.error('Error during aggressive OAuth cleanup:', error)
    }
  }
  
  /**
   * Redirect to auth page with account deleted message
   */
  static redirectToAuth(): void {
    if (typeof window !== 'undefined') {
      console.log('🔄 Redirecting to auth page to prevent OAuth auto-login...')
      // Use replace to prevent back button issues
      window.location.replace('/auth?message=account-deleted&reason=oauth-cleanup')
    }
  }
  
  /**
   * Complete OAuth cleanup and redirect
   */
  static async completeCleanupAndRedirect(): Promise<void> {
    await this.aggressiveCleanup()
    await new Promise(resolve => setTimeout(resolve, 500)) // Wait for cleanup to complete
    this.redirectToAuth()
  }
}
