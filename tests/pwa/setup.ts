import { vi } from 'vitest'

// Global PWA mocks - defined at module level to ensure proper hoisting
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(() => false),
  getPWALaunchMethod: vi.fn(() => 'browser'),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(() => false),
  registerPWA: vi.fn().mockResolvedValue(null),
  showInstallPrompt: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resendConfirmationEmail: vi.fn(),
    refetchUser: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn(() => ({
    isSupported: true,
    isRegistered: false,
    register: vi.fn().mockResolvedValue(true),
    unregister: vi.fn().mockResolvedValue(true),
    isLoading: false,
    error: null
  }))
}))

vi.mock('../../../src/hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn(() => ({
    isOnline: true,
    isSyncing: false,
    syncQueue: [],
    syncData: vi.fn(),
    clearQueue: vi.fn(),
    error: null
  }))
}))

vi.mock('../../../src/hooks/usePWARegistration', () => ({
  usePWARegistration: vi.fn(() => ({
    isSupported: true,
    isRegistered: false,
    register: vi.fn().mockResolvedValue(true),
    unregister: vi.fn().mockResolvedValue(true),
    isLoading: false,
    error: null
  }))
}))

vi.mock('../../../src/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    isSupported: true,
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
    showNotification: vi.fn(),
    error: null
  }))
}))

// Mock UI components
vi.mock('lucide-react', () => ({
  Download: () => 'Download Icon',
  Wifi: () => 'Wifi Icon',
  WifiOff: () => 'WifiOff Icon',
  CheckCircle: () => 'CheckCircle Icon',
  XCircle: () => 'XCircle Icon',
  AlertCircle: () => 'AlertCircle Icon',
  Settings: () => 'Settings Icon',
  Smartphone: () => 'Smartphone Icon',
  Globe: () => 'Globe Icon',
  Bell: () => 'Bell Icon',
  BellOff: () => 'BellOff Icon'
}))

// Mock design system components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('button', { ...props, 'data-testid': 'button' }, children)
  }
}))

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { ...props, 'data-testid': 'card' }, children)
  },
  CardHeader: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { ...props, 'data-testid': 'card-header' }, children)
  },
  CardContent: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { ...props, 'data-testid': 'card-content' }, children)
  },
  CardFooter: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', { ...props, 'data-testid': 'card-footer' }, children)
  }
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('span', { ...props, 'data-testid': 'badge' }, children)
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