/**
 * Redirect Manager - Prevents redirect loops and conflicts
 * 
 * This utility helps manage navigation state to prevent multiple
 * simultaneous redirects that could cause infinite loops.
 */

class RedirectManager {
  private isRedirecting = false
  private redirectTimeout: NodeJS.Timeout | null = null

  /**
   * Check if a redirect is currently in progress
   */
  isRedirectInProgress(): boolean {
    return this.isRedirecting
  }

  /**
   * Start a redirect operation
   * @param timeoutMs - Timeout in milliseconds (default: 5000)
   */
  startRedirect(timeoutMs: number = 5000): void {
    if (this.isRedirecting) {
      console.warn('⚠️ Redirect already in progress, ignoring new redirect request')
      return
    }

    this.isRedirecting = true
    console.log('🔄 Starting redirect operation')

    // Clear any existing timeout
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
    }

    // Set timeout to reset redirect state
    this.redirectTimeout = setTimeout(() => {
      this.reset()
    }, timeoutMs)
  }

  /**
   * Complete a redirect operation
   */
  completeRedirect(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
      this.redirectTimeout = null
    }
    this.isRedirecting = false
    console.log('✅ Redirect operation completed')
  }

  /**
   * Reset redirect state (used for cleanup)
   */
  reset(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
      this.redirectTimeout = null
    }
    this.isRedirecting = false
    console.log('🔄 Redirect state reset')
  }
}

// Export singleton instance
export const redirectManager = new RedirectManager()

/**
 * Hook to use redirect manager in React components
 */
export function useRedirectManager() {
  return {
    isRedirectInProgress: () => redirectManager.isRedirectInProgress(),
    startRedirect: (timeoutMs?: number) => redirectManager.startRedirect(timeoutMs),
    completeRedirect: () => redirectManager.completeRedirect(),
    reset: () => redirectManager.reset()
  }
}
