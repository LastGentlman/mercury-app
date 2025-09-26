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
  private maxRedirects = 3 // Reduced from 5 to 3 for faster loop detection
  private lastRedirectTime = 0
  private redirectThrottle = 2000 // Increased to 2 seconds to prevent rapid redirects
  private redirectHistory: string[] = [] // Track redirect history to detect loops

  /**
   * Check if a redirect is currently in progress
   */
  isRedirectInProgress(): boolean {
    return this.isRedirecting
  }

  /**
   * Start a redirect operation with improved loop prevention
   * @param timeoutMs - Timeout in milliseconds (default: 3000)
   * @param targetPath - Optional target path for loop detection
   */
  startRedirect(timeoutMs: number = 3000, targetPath?: string): boolean {
    const now = Date.now()
    const currentPath = globalThis.location?.pathname || '/'
    
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

    // Check for redirect loops by examining history
    if (targetPath && this.redirectHistory.length > 0) {
      const recentRedirects = this.redirectHistory.slice(-3) // Check last 3 redirects
      if (recentRedirects.includes(targetPath)) {
        console.error('❌ Potential redirect loop detected, preventing redirect to:', targetPath)
        return false
      }
    }

    this.isRedirecting = true
    this.redirectCount++
    this.lastRedirectTime = now
    
    // Add to redirect history
    if (targetPath) {
      this.redirectHistory.push(targetPath)
      // Keep only last 5 redirects
      if (this.redirectHistory.length > 5) {
        this.redirectHistory = this.redirectHistory.slice(-5)
      }
    }
    
    console.log(`🔄 Starting redirect operation (attempt ${this.redirectCount}/${this.maxRedirects})`, {
      from: currentPath,
      to: targetPath,
      history: this.redirectHistory
    })

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
   * Force redirect (bypasses throttling and redirect count for OAuth callback)
   * Used specifically for OAuth callback redirects
   */
  forceRedirect(): void {
    console.log('🚀 Force redirect - bypassing all restrictions')
    this.isRedirecting = true
    this.redirectCount = 0 // Reset count for OAuth callback
    this.lastRedirectTime = Date.now()
    
    // Clear any existing timeout
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
    }
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
   * Clear redirect history (call this when navigation is successful)
   */
  clearHistory(): void {
    this.redirectHistory = []
    console.log('🔄 Redirect history cleared')
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
    startRedirect: (timeoutMs?: number, targetPath?: string) => redirectManager.startRedirect(timeoutMs, targetPath),
    completeRedirect: () => redirectManager.completeRedirect(),
    reset: () => redirectManager.reset(),
    resetRedirectCount: () => redirectManager.resetRedirectCount(),
    getRedirectCount: () => redirectManager.getRedirectCount(),
    forceRedirect: () => redirectManager.forceRedirect(),
    clearHistory: () => redirectManager.clearHistory()
  }
}
