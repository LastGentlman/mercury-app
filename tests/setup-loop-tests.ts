import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { redirectManager } from '../src/utils/redirectManager.ts'

// Global test setup for loop prevention tests
beforeAll(() => {
  // Reset redirect manager state before all tests
  redirectManager.reset()
  redirectManager.resetRedirectCount()
})

afterEach(() => {
  // Clean up after each test
  cleanup()
  
  // Reset redirect manager state
  redirectManager.reset()
  redirectManager.resetRedirectCount()
  
  // Clear all mocks
  vi.clearAllMocks()
  
  // Clear localStorage
  localStorage.clear()
  
  // Clear any timers
  vi.clearAllTimers()
})

afterAll(() => {
  // Final cleanup
  redirectManager.reset()
  redirectManager.resetRedirectCount()
})

// Mock global objects that might cause issues in tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
  },
  writable: true,
})

Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
  writable: true,
})

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    mark: vi.fn(),
    measure: vi.fn(),
    now: vi.fn(() => Date.now()),
  },
  writable: true,
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
beforeAll(() => {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterAll(() => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})
