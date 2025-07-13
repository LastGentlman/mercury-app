import { beforeEach, vi } from 'vitest'

// PWA-specific test setup
beforeEach(() => {
  // Mock PWA utilities
  vi.mock('../../../src/pwa', () => ({
    isPWAInstalled: vi.fn().mockReturnValue(false),
    getPWALaunchMethod: vi.fn().mockReturnValue('browser'),
    markAsInstalledPWA: vi.fn(),
    wasEverInstalledAsPWA: vi.fn().mockReturnValue(false),
    registerPWA: vi.fn().mockResolvedValue(null),
    showInstallPrompt: vi.fn().mockResolvedValue(true)
  }))

  // Mock useAuth hook
  vi.mock('../../../src/hooks/useAuth', () => ({
    useAuth: vi.fn().mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resendConfirmationEmail: vi.fn(),
      refetchUser: vi.fn()
    })
  }))

  // Mock useBackgroundSync hook
  vi.mock('../../../src/hooks/useBackgroundSync', () => ({
    useBackgroundSync: vi.fn().mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn().mockResolvedValue(true),
      requestPeriodicSync: vi.fn().mockResolvedValue(true),
      getSyncStats: vi.fn().mockReturnValue({
        isEnabled: true,
        hasUser: true,
        lastSync: null,
        errorCount: 0,
        totalItems: 0
      })
    })
  }))

  // Mock useOfflineSync hook
  vi.mock('../../../src/hooks/useOfflineSync', () => ({
    useOfflineSync: vi.fn().mockReturnValue({
      isOnline: true,
      syncStatus: 'idle',
      pendingCount: 0,
      syncPendingChanges: vi.fn()
    })
  }))

  // Mock useCSRF hook
  vi.mock('../../../src/hooks/useCSRF', () => ({
    useCSRFRequest: vi.fn().mockReturnValue({
      csrfRequest: vi.fn()
    })
  }))

  // Mock offline database
  vi.mock('../../../src/lib/offline/db', () => ({
    db: {
      syncQueue: {
        count: vi.fn().mockResolvedValue(0)
      },
      getPendingSyncItems: vi.fn().mockResolvedValue([]),
      markAsSynced: vi.fn().mockResolvedValue(undefined),
      incrementRetries: vi.fn().mockResolvedValue(undefined)
    }
  }))

  // Mock conflict resolver
  vi.mock('../../../src/lib/offline/conflictResolver', () => ({
    ConflictResolver: {
      resolve: vi.fn()
    }
  }))

  // Mock React Router
  vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' })
  }))

  // Mock Lucide React icons
  vi.mock('lucide-react', () => ({
    Download: vi.fn(() => 'Download'),
    HelpCircle: vi.fn(() => 'HelpCircle'),
    Monitor: vi.fn(() => 'Monitor'),
    Smartphone: vi.fn(() => 'Smartphone')
  }))
}) 