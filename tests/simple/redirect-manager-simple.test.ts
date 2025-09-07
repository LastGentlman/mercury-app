import { describe, it, expect, beforeEach } from 'vitest'
import { redirectManager } from '../../src/utils/redirectManager.ts'

describe('RedirectManager - Simple Tests', () => {
  beforeEach(() => {
    redirectManager.reset()
    redirectManager.resetRedirectCount()
    ;(redirectManager as any).lastRedirectTime = 0
  })

  it('should prevent multiple simultaneous redirects', () => {
    const result1 = redirectManager.startRedirect(1000)
    const result2 = redirectManager.startRedirect(1000)
    
    expect(result1).toBe(true)
    expect(result2).toBe(false)
  })

  it('should track redirect count', () => {
    redirectManager.startRedirect(1000)
    expect(redirectManager.getRedirectCount()).toBe(1)
    
    redirectManager.completeRedirect()
    redirectManager.startRedirect(1000)
    expect(redirectManager.getRedirectCount()).toBe(2)
  })

  it('should reset redirect count', () => {
    redirectManager.startRedirect(1000)
    redirectManager.completeRedirect()
    expect(redirectManager.getRedirectCount()).toBe(1)
    
    redirectManager.resetRedirectCount()
    expect(redirectManager.getRedirectCount()).toBe(0)
  })
})
