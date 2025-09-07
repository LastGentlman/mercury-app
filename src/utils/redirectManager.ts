/**
 * Redirect Manager - Prevents redirect loops and conflicts
 * 
 * This utility helps manage navigation state to prevent multiple
 * simultaneous redirects that could cause infinite loops.
 */

class RedirectManager {
  private isRedirecting = false
  private redirectTimeout: NodeJS.Timeout | null = null
  private redirectCount = 0
  private maxRedirects = 5
  private lastRedirectTime = 0
  private redirectThrottle = 1000 // 1 second throttle

  /**
   * Check if a redirect is currently in progress
   */
  isRedirectInProgress(): boolean {
    return this.isRedirecting
  }

  /**
   * Start a redirect operation with improved loop prevention
   * @param timeoutMs - Timeout in milliseconds (default: 3000)
   */
  startRedirect(timeoutMs: number = 3000): boolean {
    const now = Date.now()
    
    // Check if we're already redirecting
    if (this.isRedirecting) {
      console.warn('⚠️ Redirect already in progress, ignoring new redirect request')
      return false
    }

    // Check redirect count to prevent infinite loops
    if (this.redirectCount >= this.maxRedirects) {
      console.error('❌ Maximum redirect attempts reached, preventing potential loop')
      return false
    }

    // Throttle redirects to prevent rapid successive redirects
    if (now - this.lastRedirectTime < this.redirectThrottle) {
      console.warn('⚠️ Redirect throttled, too soon since last redirect')
      return false
    }

    this.isRedirecting = true
    this.redirectCount++
    this.lastRedirectTime = now
    console.log(`🔄 Starting redirect operation (attempt ${this.redirectCount}/${this.maxRedirects})`)

    // Clear any existing timeout
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
    }

    // Set timeout to reset redirect state
    this.redirectTimeout = setTimeout(() => {
      this.reset()
    }, timeoutMs)

    return true
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
    // Don't reset redirect count here - only reset on successful navigation
    console.log('🔄 Redirect state reset')
  }

  /**
   * Reset redirect count (call this on successful navigation)
   */
  resetRedirectCount(): void {
    this.redirectCount = 0
    console.log('🔄 Redirect count reset')
  }

  /**
   * Get current redirect count
   */
  getRedirectCount(): number {
    return this.redirectCount
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
    reset: () => redirectManager.reset(),
    resetRedirectCount: () => redirectManager.resetRedirectCount(),
    getRedirectCount: () => redirectManager.getRedirectCount()
  }
}
