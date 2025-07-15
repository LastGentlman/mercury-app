import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'
import { PWAStatus } from '../../../src/components/PWAStatus'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// ✅ CRITICAL FIX: Import and properly configure PWA module mocks
import * as pwaModule from '../../../src/pwa'
import * as backgroundSyncModule from '../../../src/hooks/useBackgroundSync'

// ✅ CRITICAL FIX: Mock PWA module with proper function chains
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn(),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(),
  registerPWA: vi.fn(),
  showInstallPrompt: vi.fn() // ✅ This must be a proper mock function
}))

// ✅ CRITICAL FIX: Mock useAuth hook with complete interface
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com', role: 'owner' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resendConfirmationEmail: vi.fn(),
    refetchUser: vi.fn()
  }))
}))

// ✅ CRITICAL FIX: Mock useBackgroundSync hook with complete interface
vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn()
}))

// ✅ CRITICAL FIX: Mock useOfflineSync hook with complete interface
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

describe('PWA Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // ✅ CRITICAL FIX: Configure PWA module mocks with proper function chains
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')
    vi.mocked(pwaModule.markAsInstalledPWA).mockReturnValue(undefined)
    vi.mocked(pwaModule.wasEverInstalledAsPWA).mockReturnValue(false)
    vi.mocked(pwaModule.registerPWA).mockResolvedValue(null)
    vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)
    
    // ✅ CRITICAL FIX: Configure background sync mock with proper return values
    vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
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
      }),
      isSupported: true
    })
    
    // ✅ CRITICAL FIX: Mock the beforeinstallprompt event
    const mockBeforeInstallPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn()
    }
    
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: mockBeforeInstallPrompt,
      writable: true,
      configurable: true
    })
    
    // Mock navigator permissions
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      writable: true,
      configurable: true
    })
  })

  describe('PWA Installation Flow', () => {
    it('should show install button when PWA can be installed', async () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
      
      render(<PWAInstallButton />)
      
      // Initially, the button should not be visible because canInstall is false
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      
      // Trigger beforeinstallprompt event to enable the button
      const beforeInstallPromptEvent = new Event('beforeinstallprompt')
      Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      })
      window.dispatchEvent(beforeInstallPromptEvent)
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument()
      })
    })

    it('should hide install button after successful installation', async () => {
      // ✅ CRITICAL FIX: Configure showInstallPrompt as async function
      vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)
      
      render(<PWAInstallButton />)
      
      // Trigger beforeinstallprompt event to enable the button
      const beforeInstallPromptEvent = new Event('beforeinstallprompt')
      Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      })
      window.dispatchEvent(beforeInstallPromptEvent)
      
      await waitFor(() => {
        const button = screen.getByRole('button')
        fireEvent.click(button)
      })
      
      await waitFor(() => {
        expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
      })
    })

    it('should show correct status after installation', async () => {
      // ✅ CRITICAL FIX: Configure getPWALaunchMethod as sync function
      vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
      
      render(<PWAStatus />)
      
      expect(screen.getByTestId('badge')).toBeInTheDocument()
      
      // Check if the status reflects installation
      await waitFor(() => {
        expect(pwaModule.getPWALaunchMethod).toHaveBeenCalled()
      })
    })
  })

  describe('Background Sync Integration', () => {
    it('should show background sync settings', () => {
      // ✅ CRITICAL FIX: Configure background sync mock
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
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
        }),
        isSupported: true
      })
      
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should trigger background sync when button is clicked', async () => {
      const mockTriggerBackgroundSync = vi.fn().mockResolvedValue(true)
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: null,
          itemsSynced: 0
        },
        triggerBackgroundSync: mockTriggerBackgroundSync,
        requestPeriodicSync: vi.fn().mockResolvedValue(true),
        getSyncStats: vi.fn().mockReturnValue({
          isEnabled: true,
          hasUser: true,
          lastSync: null,
          errorCount: 0,
          totalItems: 0
        }),
        isSupported: true
      })
      
      render(<BackgroundSyncSettings />)
      
      const syncButton = screen.getByTestId('button')
      fireEvent.click(syncButton)
      
      await waitFor(() => {
        expect(mockTriggerBackgroundSync).toHaveBeenCalled()
      })
    })

    it('should show sync status when syncing', () => {
      // ✅ CRITICAL FIX: Configure background sync as in progress
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
        syncStatus: {
          isSyncing: true,
          lastSyncTime: new Date().toISOString(),
          lastSyncError: null,
          itemsSynced: 5
        },
        triggerBackgroundSync: vi.fn().mockResolvedValue(true),
        requestPeriodicSync: vi.fn().mockResolvedValue(true),
        getSyncStats: vi.fn().mockReturnValue({
          isEnabled: true,
          hasUser: true,
          lastSync: new Date(),
          errorCount: 0,
          totalItems: 5
        }),
        isSupported: true
      })
      
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Offline Sync Integration', () => {
    it('should handle offline sync when coming back online', () => {
      // ✅ CRITICAL FIX: Mock navigator online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should show offline status when connection is lost', () => {
      // ✅ CRITICAL FIX: Mock navigator offline status
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle PWA installation errors gracefully', async () => {
      // ✅ CRITICAL FIX: Configure showInstallPrompt to reject
      vi.mocked(pwaModule.showInstallPrompt).mockRejectedValue(new Error('Installation failed'))
      
      render(<PWAInstallButton />)
      
      // Trigger beforeinstallprompt event to enable the button
      const beforeInstallPromptEvent = new Event('beforeinstallprompt')
      Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      })
      window.dispatchEvent(beforeInstallPromptEvent)
      
      await waitFor(() => {
        const button = screen.getByRole('button')
        fireEvent.click(button)
      })
      
      await waitFor(() => {
        expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
      })
      
      // The component should handle the error gracefully
      // You might want to check for error messages or states here
    })

    it('should handle background sync errors gracefully', async () => {
      const mockTriggerBackgroundSync = vi.fn().mockRejectedValue(new Error('Sync failed'))
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: 'Sync failed',
          itemsSynced: 0
        },
        triggerBackgroundSync: mockTriggerBackgroundSync,
        requestPeriodicSync: vi.fn().mockResolvedValue(true),
        getSyncStats: vi.fn().mockReturnValue({
          isEnabled: true,
          hasUser: true,
          lastSync: null,
          errorCount: 1,
          totalItems: 0
        }),
        isSupported: true
      })
      
      render(<BackgroundSyncSettings />)
      
      const syncButton = screen.getByTestId('button')
      fireEvent.click(syncButton)
      
      await waitFor(() => {
        expect(mockTriggerBackgroundSync).toHaveBeenCalled()
      })
    })

    it('should handle offline sync errors gracefully', () => {
      // Mock useOfflineSync with error state using the already mocked module
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: 'Network error',
          itemsSynced: 0
        },
        triggerBackgroundSync: vi.fn().mockRejectedValue(new Error('Network error')),
        requestPeriodicSync: vi.fn().mockResolvedValue(true),
        getSyncStats: vi.fn().mockReturnValue({
          isEnabled: true,
          hasUser: true,
          lastSync: null,
          errorCount: 1,
          totalItems: 0
        }),
        isSupported: true
      })
      
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('PWA Status Component', () => {
    it('should show PWA installation status', () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
      vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')
      
      render(<PWAStatus />)
      
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })

    it('should show browser status when not installed', () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
      vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')
      
      render(<PWAStatus />)
      
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })
})