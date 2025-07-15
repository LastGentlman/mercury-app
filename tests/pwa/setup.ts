import { vi } from 'vitest'
import '@testing-library/jest-dom'

// ✅ CRITICAL FIX: Mock UI components with proper test IDs
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('button', { 
      ...props, 
      'data-testid': 'button',
      type: 'button' 
    }, children)
  }
}))

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { 
      ...props, 
      'data-testid': 'card' 
    }, children)
  },
  CardHeader: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { 
      ...props, 
      'data-testid': 'card-header' 
    }, children)
  },
  CardContent: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { 
      ...props, 
      'data-testid': 'card-content' 
    }, children)
  },
  CardFooter: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { 
      ...props, 
      'data-testid': 'card-footer' 
    }, children)
  }
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('span', { 
      ...props, 
      'data-testid': 'badge' 
    }, children)
  }
}))

vi.mock('../../../src/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => {
    const React = require('react')
    return React.createElement('input', {
      type: 'checkbox',
      checked,
      onChange: (e: any) => onCheckedChange?.(e.target.checked),
      ...props,
      'data-testid': 'switch'
    })
  }
}))

// ✅ CRITICAL FIX: Mock auth hook with complete interface
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '1',
      email: 'test@example.com',
      role: 'owner'
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resendConfirmationEmail: vi.fn(),
    refetchUser: vi.fn()
  }))
}))

// ✅ CRITICAL FIX: Mock background sync hook with proper interface
vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn(() => ({
    syncStatus: {
      isSyncing: false,
      lastSyncTime: null,
      lastSyncError: null,
      itemsSynced: 0
    },
    triggerBackgroundSync: vi.fn(() => Promise.resolve(true)),
    requestPeriodicSync: vi.fn(() => Promise.resolve(true)),
    getSyncStats: vi.fn(() => ({
      isEnabled: true,
      hasUser: true,
      lastSync: null,
      errorCount: 0,
      totalItems: 0
    })),
    isSupported: true
  }))
}))

// ✅ CRITICAL FIX: Mock offline sync hook with proper interface
vi.mock('../../../src/hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn(() => ({
    isOnline: true,
    syncStatus: 'idle',
    syncPendingChanges: vi.fn(),
    pendingCount: 0,
    updatePendingCount: vi.fn(),
    isSyncing: false,
    error: null,
    addPendingChange: vi.fn()
  }))
}))

// ✅ CRITICAL FIX: Mock PWA registration hook
vi.mock('../../../src/hooks/usePWARegistration', () => ({
  usePWARegistration: vi.fn(() => ({
    isSupported: true,
    isRegistered: false,
    register: vi.fn(() => Promise.resolve(true)),
    unregister: vi.fn(() => Promise.resolve(true)),
    isLoading: false,
    error: null
  }))
}))

// ✅ CRITICAL FIX: Mock notifications hook
vi.mock('../../../src/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    isSupported: true,
    permission: 'granted',
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    showNotification: vi.fn(),
    error: null
  }))
}))

// ✅ GLOBAL MOCKS: Browser APIs
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(() => Promise.resolve({
        scope: '/',
        updateViaCache: 'all',
        sync: {
          register: vi.fn(() => Promise.resolve())
        },
        periodicSync: {
          register: vi.fn(() => Promise.resolve())
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        unregister: vi.fn(() => Promise.resolve(true))
      })),
      ready: Promise.resolve({
        scope: '/',
        sync: {
          register: vi.fn(() => Promise.resolve())
        },
        periodicSync: {
          register: vi.fn(() => Promise.resolve())
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    permissions: {
      query: vi.fn(() => Promise.resolve({ state: 'granted' }))
    },
    onLine: true
  },
  writable: true,
  configurable: true
})

// ✅ Mock global fetch
Object.defineProperty(global, 'fetch', {
  value: vi.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('success')
  })),
  writable: true,
  configurable: true
})

// ✅ Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true,
  configurable: true
})

// ✅ Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
  },
  writable: true,
  configurable: true
})

// ✅ Mock beforeinstallprompt event
Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  },
  writable: true,
  configurable: true
}) 