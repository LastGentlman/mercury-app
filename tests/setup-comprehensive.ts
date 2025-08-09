import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import process from 'node:process'
import '@testing-library/jest-dom'

// Import our API handlers
import { allHandlers } from './mocks/api-handlers.ts'

// Setup MSW server
export const server = setupServer(...allHandlers)

// Global mocks that are needed across all tests
beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn'
  })

  // Mock environment variables
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.VITE_API_BASE_URL = 'http://localhost:3000/api'

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock navigator.serviceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        unregister: vi.fn().mockResolvedValue(true),
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          postMessage: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        unregister: vi.fn().mockResolvedValue(true),
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getRegistration: vi.fn().mockResolvedValue(undefined),
      getRegistrations: vi.fn().mockResolvedValue([]),
    },
    writable: true,
  })

  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  })

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  })

  // Mock IndexedDB
  const mockIDBKeyRange = {
    bound: vi.fn(),
    only: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
  }
  Object.defineProperty(window, 'IDBKeyRange', {
    value: mockIDBKeyRange,
  })

  // Mock crypto.randomUUID
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }),
    },
  })

  // Mock fetch if not already mocked
  if (!globalThis.fetch) {
    globalThis.fetch = vi.fn()
  }

  // Mock console methods to reduce noise in tests
  globalThis.console = {
    ...console,
    // Keep error and warn for debugging
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  }

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    },
  })

  // Mock URL.createObjectURL
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-url'),
  })

  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
  })

  // Mock canvas methods
  ;(HTMLCanvasElement.prototype.getContext as unknown) = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
  }))

  // Mock audio/video elements
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  HTMLMediaElement.prototype.load = vi.fn()

  // Mock notification API
  Object.defineProperty(window, 'Notification', {
    value: vi.fn().mockImplementation(() => ({
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
  Object.defineProperty(Notification, 'permission', {
    value: 'granted',
    writable: true,
  })
  Object.defineProperty(Notification, 'requestPermission', {
    value: vi.fn().mockResolvedValue('granted'),
  })

  // Mock geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: {
            latitude: 19.4326,
            longitude: -99.1332,
            accuracy: 100,
          },
        })
      ),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
  })

  // Mock touch events
  Object.defineProperty(window, 'ontouchstart', {
    value: null,
  })

  // Mock device orientation
  Object.defineProperty(window, 'DeviceOrientationEvent', {
    value: vi.fn(),
  })

  // Mock web workers
  Object.defineProperty(window, 'Worker', {
    value: vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })

  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
    },
  })

  // Mock battery API
  Object.defineProperty(navigator, 'getBattery', {
    value: vi.fn().mockResolvedValue({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })

  // Mock network information
  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })

  // Mock payment request API
  Object.defineProperty(window, 'PaymentRequest', {
    value: vi.fn().mockImplementation(() => ({
      show: vi.fn().mockResolvedValue({}),
      abort: vi.fn().mockResolvedValue(undefined),
      canMakePayment: vi.fn().mockResolvedValue(true),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })

  // Mock share API
  Object.defineProperty(navigator, 'share', {
    value: vi.fn().mockResolvedValue(undefined),
  })

  // Mock wake lock API
  Object.defineProperty(navigator, 'wakeLock', {
    value: {
      request: vi.fn().mockResolvedValue({
        release: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    },
  })
})

afterEach(() => {
  // Clean up after each test
  cleanup()
  
  // Reset all mocks
  vi.clearAllMocks()
  
  // Reset MSW handlers
  server.resetHandlers()
  
  // Clear localStorage/sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  })
  
  // Reset console methods
  vi.mocked(console.log).mockClear?.()
  vi.mocked(console.debug).mockClear?.()
  vi.mocked(console.info).mockClear?.()
})

afterAll(() => {
  // Stop MSW server
  server.close()
})

// Utility functions for tests
export const testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock successful API responses
  mockApiSuccess: (_data: unknown) => {
    server.use(
      // Dynamic handler based on test needs
    )
  },
  
  // Mock API errors
  mockApiError: (_status: number, _message: string) => {
    server.use(
      // Dynamic error handler
    )
  },
  
  // Simulate network conditions
  simulateOffline: () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    globalThis.dispatchEvent(new Event('offline'))
  },
  
  simulateOnline: () => {
    Object.defineProperty(navigator, 'onLine', { value: true })
    globalThis.dispatchEvent(new Event('online'))
  },
  
  // Mock auth state
  mockAuthenticatedUser: () => {
    localStorage.setItem('authToken', 'mock-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      businessId: 'test-business'
    }))
  },
  
  mockUnauthenticatedUser: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },
  
  // Mock IndexedDB operations
  mockIndexedDB: {
    success: (result: unknown) => ({
      result,
      error: null,
      onsuccess: vi.fn(),
      onerror: vi.fn(),
    }),
    
    error: (message: string) => ({
      result: null,
      error: new Error(message),
      onsuccess: vi.fn(),
      onerror: vi.fn(),
    }),
  },
  
  // Mock form validation
  mockValidationError: (field: string, message: string) => ({
    [field]: [message]
  }),
  
  // Create mock events
  createMockEvent: (type: string, data: unknown = {}) => ({
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...(data as Record<string, unknown>)
  }),
  
  // Mock intersection observer entries
  createMockIntersectionEntry: (isIntersecting: boolean = true) => ({
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    target: document.createElement('div'),
    boundingClientRect: { top: 0, left: 0, right: 100, bottom: 100 },
    intersectionRect: { top: 0, left: 0, right: 100, bottom: 100 },
    rootBounds: { top: 0, left: 0, right: 1000, bottom: 1000 },
    time: Date.now(),
  }),
}

// Custom matchers can be added here
// export {}

// declare global {
//   namespace Vi {
//     interface JestAssertion<T = unknown> {
//       // Add custom matchers here if needed
//     }
//   }
// } 