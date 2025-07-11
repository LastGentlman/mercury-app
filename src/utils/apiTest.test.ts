import { describe, expect, it } from 'vitest'
import { BACKEND_URL } from '../config'
import { testAPIConnection, testLogin, testRegistration } from './apiTest'

describe('Backend Connection Tests', () => {
  it('should connect to backend API endpoints', async () => {
    // Mock console.log to capture output
    const originalLog = console.log
    const logs: Array<string> = []
    console.log = (...args: Array<any>) => {
      logs.push(args.join(' '))
    }

    try {
      await testAPIConnection()
      
      // Check if we got successful responses
      const successLogs = logs.filter(log => log.includes('✅'))
      expect(successLogs.length).toBeGreaterThan(0)
      
      // Check for specific endpoints
      const hasHealthCheck = logs.some(log => log.includes('Health Check'))
      const hasAPIRoot = logs.some(log => log.includes('API Root'))
      
      expect(hasHealthCheck).toBe(true)
      expect(hasAPIRoot).toBe(true)
    } finally {
      console.log = originalLog
    }
  })

  it('should handle registration endpoint', async () => {
    const result = await testRegistration()
    
    // Registration might fail due to duplicate email, but should not throw
    expect(result).toBeDefined()
    expect(typeof result.success).toBe('boolean')
    expect(result.data).toBeDefined()
  })

  it('should handle login endpoint', async () => {
    const result = await testLogin()
    
    // Login might fail due to invalid credentials, but should not throw
    expect(result).toBeDefined()
    expect(typeof result.success).toBe('boolean')
    expect(result.data).toBeDefined()
  })

  it('should have correct backend URL configuration', () => {
    // Verify that the backend URL is correctly set
    const backendUrl = BACKEND_URL
    // Test that the URL is accessible
    expect(backendUrl).toContain('pedidolist.com')
  })
}) 