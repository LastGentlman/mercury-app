import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// ✅ SETUP MSW SERVER
export const server = setupServer(...handlers)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ✅ MSW SERVER LIFECYCLE
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ✅ MOCK COMPLETO DE LUCIDE-REACT
vi.mock('lucide-react', () => ({
  Download: () => 'Download Icon',
  Wifi: () => 'Wifi Icon',
  WifiOff: () => 'WifiOff Icon',
  CheckCircle: () => 'CheckCircle Icon',
  XCircle: () => 'XCircle Icon',
  Clock: () => 'Clock Icon',
  Smartphone: () => 'Smartphone Icon',
  Monitor: () => 'Monitor Icon',
  Settings: () => 'Settings Icon',         // ⚠️ FALTABA
  RefreshCw: () => 'RefreshCw Icon',       // ⚠️ FALTABA
  AlertCircle: () => 'AlertCircle Icon',   // ⚠️ FALTABA
  Bell: () => 'Bell Icon',
  BellOff: () => 'BellOff Icon',
  Sync: () => 'Sync Icon',
  SyncOff: () => 'SyncOff Icon',
  HelpCircle: () => 'HelpCircle Icon'      // ⚠️ FALTABA PARA PWAStatus
}))

// ✅ MOCK DEL MÓDULO PWA (BASE)
vi.mock('../src/pwa', () => ({
  isPWAInstalled: vi.fn(() => false),
  getPWALaunchMethod: vi.fn(() => 'browser'),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(() => false),
  registerPWA: vi.fn().mockResolvedValue(null),
  showInstallPrompt: vi.fn().mockResolvedValue(true)
}))

// ✅ MOCK DE USEAUTH CON ESTRUCTURA COMPLETA
const createMockMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  isIdle: true,
  status: 'idle' as const,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  variables: undefined,
  context: undefined,
  submittedAt: 0
})

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: createMockMutation(),
    logout: createMockMutation(),
    register: createMockMutation(),
    resendConfirmationEmail: createMockMutation(),
    refetchUser: vi.fn().mockResolvedValue(undefined)
  }))
}))

// ✅ MOCK DE BASE DE DATOS OFFLINE
const mockDb = {
  syncQueue: {
    count: vi.fn().mockResolvedValue(0),
    add: vi.fn().mockResolvedValue(1),
    toArray: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  },
  getPendingSyncItems: vi.fn().mockResolvedValue([]),
  markAsSynced: vi.fn().mockResolvedValue(undefined),
  incrementRetries: vi.fn().mockResolvedValue(undefined)
}

vi.mock('../src/lib/offline/db', () => ({
  db: mockDb
}))

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

// ✅ MOCK GLOBAL DEL SERVICE WORKER
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn().mockResolvedValue({
        scope: '/',
        updateViaCache: 'all',
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        },
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      ready: Promise.resolve({
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        },
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' })
    }
  },
  writable: true,
  configurable: true
})

// ✅ MOCK DE CACHES API
Object.defineProperty(global, 'caches', {
  value: {
    open: vi.fn().mockResolvedValue({
      addAll: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true)
    }),
    match: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined)
  },
  writable: true,
  configurable: true
})

// ✅ MOCK DE FETCH GLOBAL
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue('')
})

// Mock indexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn().mockResolvedValue([])
} as any

// Mock beforeinstallprompt
Object.defineProperty(global.window, 'beforeinstallprompt', {
  value: {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
    preventDefault: vi.fn()
  },
  writable: true,
  configurable: true
})

// Mock matchMedia
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

// Mock localStorage
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

// Mock console to reduce noise in tests
global.console = {
  ...global.console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
} 