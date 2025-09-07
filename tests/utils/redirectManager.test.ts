import { describe, it, expect, beforeEach, vi } from 'vitest'
import { redirectManager } from '../../src/utils/redirectManager.ts'

describe('RedirectManager', () => {
  beforeEach(() => {
    // Reset the redirect manager state before each test
    redirectManager.reset()
    redirectManager.resetRedirectCount()
    // Also reset the last redirect time to ensure throttling tests work
    ;(redirectManager as any).lastRedirectTime = 0
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should start with no redirect in progress', () => {
      expect(redirectManager.isRedirectInProgress()).toBe(false)
      expect(redirectManager.getRedirectCount()).toBe(0)
    })

    it('should start a redirect operation', () => {
      const result = redirectManager.startRedirect(1000)
      
      expect(result).toBe(true)
      expect(redirectManager.isRedirectInProgress()).toBe(true)
      expect(redirectManager.getRedirectCount()).toBe(1)
    })

    it('should complete a redirect operation', () => {
      redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()
      
      expect(redirectManager.isRedirectInProgress()).toBe(false)
    })

    it('should reset redirect state', () => {
      redirectManager.startRedirect(1000)
      redirectManager.reset()
      
      expect(redirectManager.isRedirectInProgress()).toBe(false)
    })
  })

  describe('Loop prevention', () => {
    it('should prevent multiple simultaneous redirects', () => {
      const result1 = redirectManager.startRedirect(1000)
      const result2 = redirectManager.startRedirect(1000)
      
      expect(result1).toBe(true)
      expect(result2).toBe(false) // Should be rejected
      expect(redirectManager.getRedirectCount()).toBe(1)
    })

    it('should throttle rapid successive redirects', () => {
      const result1 = redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()
      
      // Try to start another redirect immediately (should be throttled)
      const result2 = redirectManager.startRedirect(1000)
      
      expect(result1).toBe(true)
      expect(result2).toBe(false) // Should be throttled
    })

    it('should prevent infinite loops with max redirect count', () => {
      // Simulate multiple redirects
      for (let i = 0; i < 5; i++) {
        const result = redirectManager.startRedirect(1000)
        expect(result).toBe(true) // Each redirect should succeed
        redirectManager.completeRedirect()
        // Reset the last redirect time to allow the next redirect
        ;(redirectManager as any).lastRedirectTime = 0
      }
      
      // The 6th redirect should be rejected
      const result = redirectManager.startRedirect(1000)
      
      expect(result).toBe(false)
      expect(redirectManager.getRedirectCount()).toBe(5)
    })

    it('should reset redirect count when explicitly called', () => {
      // Simulate some redirects
      redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()
      // Reset the last redirect time to allow the next redirect
      ;(redirectManager as any).lastRedirectTime = 0
      redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()
      
      expect(redirectManager.getRedirectCount()).toBe(2)
      
      redirectManager.resetRedirectCount()
      expect(redirectManager.getRedirectCount()).toBe(0)
    })
  })

  describe('Timeout handling', () => {
    it('should reset redirect state after timeout', async () => {
      redirectManager.startRedirect(100) // 100ms timeout
      
      expect(redirectManager.isRedirectInProgress()).toBe(true)
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(redirectManager.isRedirectInProgress()).toBe(false)
    })

    it('should clear timeout when completing redirect', () => {
      redirectManager.startRedirect(1000)
      redirectManager.completeRedirect()
      
      // Should not reset after timeout since we completed it
      expect(redirectManager.isRedirectInProgress()).toBe(false)
    })
  })
})
