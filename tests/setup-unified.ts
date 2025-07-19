import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// ✅ MSW Server
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
import React from 'react'
afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

// ✅ MOCKS COMPLETOS DE LUCIDE REACT - TODOS LOS ICONOS USADOS
vi.mock('lucide-react', () => ({
  // Iconos existentes en setup actual
  Download: () => 'Download Icon',
  Wifi: () => 'Wifi Icon',
  WifiOff: () => 'WifiOff Icon',
  CheckCircle: () => 'CheckCircle Icon',
  XCircle: () => 'XCircle Icon',
  Clock: () => 'Clock Icon',
  Smartphone: () => 'Smartphone Icon',
  Monitor: () => 'Monitor Icon',
  Settings: () => 'Settings Icon',
  RefreshCw: () => 'RefreshCw Icon',
  AlertCircle: () => 'AlertCircle Icon',
  Bell: () => 'Bell Icon',
  BellOff: () => 'BellOff Icon',
  Sync: () => 'Sync Icon',
  SyncOff: () => 'SyncOff Icon',
  HelpCircle: () => 'HelpCircle Icon',
  
  // ⚠️ ICONOS FALTANTES CRÍTICOS
  Loader2: () => 'Loader2 Icon',
  Plus: () => 'Plus Icon',
  Package: () => 'Package Icon',
  ShoppingCart: () => 'ShoppingCart Icon',
  Users: () => 'Users Icon',
  DollarSign: () => 'DollarSign Icon',
  TrendingUp: () => 'TrendingUp Icon',
  Edit: () => 'Edit Icon',
  Trash2: () => 'Trash2 Icon',
  Eye: () => 'Eye Icon',
  EyeOff: () => 'EyeOff Icon',
  LogOut: () => 'LogOut Icon',
  User: () => 'User Icon',
  AlertTriangle: () => 'AlertTriangle Icon',
  Server: () => 'Server Icon',
  Database: () => 'Database Icon',
  Globe: () => 'Globe Icon',
  Copy: () => 'Copy Icon',
  MessageCircle: () => 'MessageCircle Icon',
  Minus: () => 'Minus Icon',
  X: () => 'X Icon',
  Home: () => 'Home Icon',
  Play: () => 'Play Icon',
  Calendar: () => 'Calendar Icon',
  MoreVertical: () => 'MoreVertical Icon',
  Phone: () => 'Phone Icon',
  Info: () => 'Info Icon'
}))

// ✅ MOCK INTELIGENTE DE useAuth
let mockAuthState: {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false
}

const createMockMutation = (onSuccess?: () => void) => {
  const mutation = {
    mutate: vi.fn((_data: unknown) => {
      // Simular async behavior
      setTimeout(() => {
        if (onSuccess) onSuccess()
        mutation.isSuccess = true
        mutation.isPending = false
      }, 0)
    }),
    mutateAsync: vi.fn().mockImplementation(async (_data: unknown) => {
      if (onSuccess) onSuccess()
      mutation.isSuccess = true
      mutation.isPending = false
      return { success: true }
    }),
    reset: vi.fn(() => {
      mutation.isSuccess = false
      mutation.isPending = false
      mutation.isError = false
    }),
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
  }
  return mutation
}

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    ...mockAuthState,
    login: createMockMutation(() => {
      mockAuthState.isAuthenticated = true
      mockAuthState.user = { id: '1', email: 'test@example.com', name: 'Test User' }
    }),
    logout: createMockMutation(() => {
      mockAuthState.isAuthenticated = false
      mockAuthState.user = null
    }),
    register: createMockMutation(() => {
      mockAuthState.isAuthenticated = true
      mockAuthState.user = { id: '2', email: 'new@example.com', name: 'New User' }
    }),
    resendConfirmationEmail: createMockMutation(),
    refetchUser: vi.fn().mockResolvedValue(undefined)
  }))
}))

// ✅ MOCK UNIFICADO DE PWA
vi.mock('../src/pwa', () => ({
  isPWAInstalled: vi.fn(() => false),
  getPWALaunchMethod: vi.fn(() => 'browser'),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(() => false),
  registerPWA: vi.fn().mockResolvedValue(null),
  showInstallPrompt: vi.fn().mockResolvedValue(true),
  listenForInstallPrompt: vi.fn(),
  cleanupPWAListeners: vi.fn()
}))

// ✅ MOCK DE REACT ROUTER
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    navigate: vi.fn(),
    state: { location: { pathname: '/' } }
  }),
  Link: ({ children, ...props }: any) => 
    React.createElement('a', { ...props, 'data-testid': 'link' }, children)
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

// ✅ CRITICAL FIX: Mock completo de useOfflineSync
vi.mock('../src/hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn(() => ({
    isOnline: true,
    syncStatus: 'idle' as const,
    syncPendingChanges: vi.fn().mockResolvedValue(undefined),
    pendingCount: 0,
    updatePendingCount: vi.fn(),
    isSyncing: false,
    error: null,
    addPendingChange: vi.fn()
  }))
}))

// ✅ MOCK DE UI COMPONENTS - VERSIÓN CORREGIDA
vi.mock('../src/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => 
    React.createElement('button', { ...props, 'data-testid': 'button' }, children)
}))

vi.mock('../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'card' }, children),
  CardHeader: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'card-header' }, children),
  CardContent: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'card-content' }, children),
  CardFooter: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'card-footer' }, children)
}))

vi.mock('../src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => 
    React.createElement('span', { ...props, 'data-testid': 'badge' }, children)
}))

vi.mock('../src/components/ui/switch', () => ({
  Switch: ({ ...props }: any) => 
    React.createElement('input', { type: 'checkbox', ...props, 'data-testid': 'switch' })
}))

vi.mock('../src/components/ui/dialog', () => ({
  Dialog: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'dialog' }, children),
  DialogTrigger: ({ children, ...props }: any) => 
    React.createElement('button', { ...props, 'data-testid': 'dialog-trigger' }, children),
  DialogContent: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children, ...props }: any) => 
    React.createElement('h2', { ...props, 'data-testid': 'dialog-title' }, children),
  DialogDescription: ({ children, ...props }: any) => 
    React.createElement('p', { ...props, 'data-testid': 'dialog-description' }, children),
  DialogFooter: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'dialog-footer' }, children)
}))

vi.mock('../src/components/ui/input', () => ({
  Input: ({ ...props }: any) => 
    React.createElement('input', { ...props, 'data-testid': 'input' })
}))

vi.mock('../src/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => 
    React.createElement('label', { ...props, 'data-testid': 'label' }, children)
}))

vi.mock('../src/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => 
    React.createElement('select', { ...props, 'data-testid': 'select' }, children),
  SelectTrigger: ({ children, ...props }: any) => 
    React.createElement('button', { ...props, 'data-testid': 'select-trigger' }, children),
  SelectContent: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'select-content' }, children),
  SelectItem: ({ children, ...props }: any) => 
    React.createElement('div', { ...props, 'data-testid': 'select-item' }, children)
}))

vi.mock('../src/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => 
    React.createElement('textarea', { ...props, 'data-testid': 'textarea' })
}))

// ✅ CRITICAL FIX: Mock de fetch mejorado
global.fetch = vi.fn().mockImplementation((_input: RequestInfo | URL, _init?: RequestInit) => {
  // Mock por defecto para requests no específicos
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    statusText: 'OK'
  } as Response)
})

// ✅ CRITICAL FIX: Reset fetch mock en cada test
beforeEach(() => {
  vi.clearAllMocks()
  // Reset fetch mock to default implementation
  if (global.fetch && typeof global.fetch === 'function') {
    (global.fetch as any).mockImplementation((_input: RequestInfo | URL, _init?: RequestInit) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers(),
        statusText: 'OK'
      } as Response)
    })
  }
})

// Service Worker Mock
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
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
  configurable: true
})

// Mock permissions
Object.defineProperty(global.navigator, 'permissions', {
  value: {
    query: vi.fn().mockResolvedValue({ state: 'granted' })
  },
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