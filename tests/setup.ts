import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// Setup MSW server for API mocking
export const server = setupServer(...handlers)

// Mock browser APIs for PWA testing
const mockServiceWorkerRegistration = {
  scope: '/',
  updateViaCache: 'all',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  sync: {
    register: vi.fn().mockResolvedValue(undefined)
  },
  periodicSync: {
    register: vi.fn().mockResolvedValue(undefined)
  },
  update: vi.fn(),
  unregister: vi.fn()
}

const mockServiceWorker = {
  register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
  ready: Promise.resolve(mockServiceWorkerRegistration),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
  getRegistrations: vi.fn().mockResolvedValue([mockServiceWorkerRegistration])
}

const mockBeforeInstallPrompt = {
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted' })
}

const mockPermissions = {
  query: vi.fn().mockResolvedValue({ state: 'granted' })
}

const mockCaches = {
  open: vi.fn().mockResolvedValue({
    addAll: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  }),
  match: vi.fn().mockResolvedValue(undefined),
  addAll: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined)
}

// Setup global browser API mocks
beforeEach(() => {
  // Mock navigator
  global.navigator = {
    serviceWorker: mockServiceWorker,
    permissions: mockPermissions,
    onLine: true,
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    cookieEnabled: true,
    doNotTrack: null,
    maxTouchPoints: 0,
    hardwareConcurrency: 4,
    deviceMemory: 8,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    }
  } as any

  // Mock window
  global.window = {
    ...global.window,
    beforeinstallprompt: mockBeforeInstallPrompt,
    matchMedia: vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    }
  } as any

  // Mock document
  global.document = {
    ...global.document,
    readyState: 'complete',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createElement: vi.fn(),
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn()
  } as any

  // Mock caches
  global.caches = mockCaches as any

  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map()
  })

  // Mock indexedDB
  global.indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
    databases: vi.fn().mockResolvedValue([])
  } as any

  // Mock console methods to reduce noise in tests
  global.console = {
    ...global.console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }

  // Reset all mocks
  vi.clearAllMocks()
})

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => server.close()) 