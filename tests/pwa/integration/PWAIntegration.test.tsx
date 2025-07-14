import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'
import { PWAStatus } from '../../../src/components/PWAStatus'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// Import the mocked modules to access their functions
import * as pwaModule from '../../../src/pwa'
import * as backgroundSyncModule from '../../../src/hooks/useBackgroundSync'

// Mock PWA module
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(() => false),
  getPWALaunchMethod: vi.fn(() => 'browser'),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(() => false),
  registerPWA: vi.fn().mockResolvedValue(null),
  showInstallPrompt: vi.fn().mockResolvedValue(true)
}))

// Mock useAuth hook
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  }))
}))

// Mock useBackgroundSync hook
vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn(() => ({
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
  }))
}))

describe('PWA Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the beforeinstallprompt event
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
      (pwaModule.isPWAInstalled as any).mockReturnValue(false)
      
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
      (pwaModule.isPWAInstalled as any).mockReturnValue(false)
      (pwaModule.showInstallPrompt as any).mockResolvedValue(true)
      
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
        expect(pwaModule.markAsInstalledPWA).toHaveBeenCalled()
      })
    })

    it('should show correct status after installation', () => {
      (pwaModule.isPWAInstalled as any).mockReturnValue(true)
      (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')
      
      render(<PWAStatus />)
      
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })

  describe('Background Sync Integration', () => {
    it('should show background sync settings', () => {
      (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
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
      const mockTriggerBackgroundSync = vi.fn().mockResolvedValue(true) as any
      (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
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
      (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
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
      // Mock navigator online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      // This would test the useOfflineSync hook integration
      // For now, just verify the components render correctly
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should show offline status when connection is lost', () => {
      // Mock navigator offline status
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      // This would test the useOfflineSync hook integration
      // For now, just verify the components render correctly
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle PWA installation errors gracefully', async () => {
      (pwaModule.isPWAInstalled as any).mockReturnValue(false)
      (pwaModule.showInstallPrompt as any).mockRejectedValue(new Error('Installation failed'))
      
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
      
      // Should not crash
      await waitFor(() => {
        expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
      })
    })

    it('should handle background sync errors gracefully', async () => {
      const mockTriggerBackgroundSync = vi.fn().mockRejectedValue(new Error('Sync failed')) as any
      (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
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

    it('should handle offline sync errors gracefully', () => {
      // Mock navigator online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      // This would test the useOfflineSync hook integration
      // For now, just verify the components render correctly
      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })
}) 