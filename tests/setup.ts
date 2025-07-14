import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Note: Module-level mocks have been moved to individual test files
// to ensure proper hoisting and mock recognition

// Mock design system components
vi.mock('./src/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => {
    return { type: 'button', props: { ...props, 'data-testid': 'button' }, children }
  }
}))

vi.mock('./src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => {
    return { type: 'div', props: { ...props, 'data-testid': 'card' }, children }
  },
  CardHeader: ({ children, ...props }: any) => {
    return { type: 'div', props: { ...props, 'data-testid': 'card-header' }, children }
  },
  CardContent: ({ children, ...props }: any) => {
    return { type: 'div', props: { ...props, 'data-testid': 'card-content' }, children }
  },
  CardFooter: ({ children, ...props }: any) => {
    return { type: 'div', props: { ...props, 'data-testid': 'card-footer' }, children }
  }
}))

vi.mock('./src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => {
    return { type: 'span', props: { ...props, 'data-testid': 'badge' }, children }
  }
}))

vi.mock('./src/components/ui/switch', () => ({
  Switch: ({ ...props }: any) => {
    return { type: 'input', props: { type: 'checkbox', ...props, 'data-testid': 'switch' } }
  }
}))

vi.mock('lucide-react', () => ({
  Download: () => 'Download Icon',
  Wifi: () => 'Wifi Icon',
  WifiOff: () => 'WifiOff Icon',
  CheckCircle: () => 'CheckCircle Icon',
  XCircle: () => 'XCircle Icon',
  Clock: () => 'Clock Icon',
  Smartphone: () => 'Smartphone Icon',
  Monitor: () => 'Monitor Icon'
}))

// Mock Service Worker globals first - BEFORE any imports
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    scope: '/',
    updateViaCache: 'all',
    unregister: vi.fn(),
    update: vi.fn(),
    installing: null,
    waiting: null,
    active: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  ready: Promise.resolve({
    scope: '/',
    active: {
      postMessage: vi.fn()
    },
    sync: {
      register: vi.fn().mockResolvedValue(undefined)
    },
    periodicSync: {
      register: vi.fn().mockResolvedValue(undefined)
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getRegistration: vi.fn().mockResolvedValue(null),
  getRegistrations: vi.fn().mockResolvedValue([])
}

const mockNavigator = {
  serviceWorker: mockServiceWorker,
  permissions: {
    query: vi.fn().mockResolvedValue({ state: 'granted' })
  },
  onLine: true,
  userAgent: 'Mozilla/5.0 (Test Browser)',
  language: 'en-US',
  languages: ['en-US', 'en'],
  cookieEnabled: true,
  maxTouchPoints: 0,
  hardwareConcurrency: 4,
  deviceMemory: 8,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
}

const mockBeforeInstallPrompt = {
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted' }),
  preventDefault: vi.fn()
}

// Setup global environment
beforeAll(() => {
  // Mock console to reduce noise in tests
  global.console = {
    ...global.console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }

  // Setup globals
  global.navigator = mockNavigator as any
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

  // Mock caches
  global.caches = {
    open: vi.fn().mockResolvedValue({
      add: vi.fn(),
      addAll: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn(),
      matchAll: vi.fn().mockResolvedValue([])
    }),
    has: vi.fn().mockResolvedValue(false),
    delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue([]),
    match: vi.fn()
  } as any
})

beforeEach(() => {
    // Setup window properties for each test
  Object.defineProperty(global.window, 'beforeinstallprompt', {
      value: mockBeforeInstallPrompt,
      writable: true,
      configurable: true
    })

    Object.defineProperty(global.window, 'matchMedia', {
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      writable: true,
      configurable: true
    })

    Object.defineProperty(global.window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
      },
      writable: true,
      configurable: true
    })

  // Reset all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
}) 