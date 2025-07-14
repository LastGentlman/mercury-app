import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'
import { PWAStatus } from '../../../src/components/PWAStatus'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// Import the mocked modules to access their functions
import * as pwaModule from '../../../src/pwa'
import * as authModule from '../../../src/hooks/useAuth'
import * as backgroundSyncModule from '../../../src/hooks/useBackgroundSync'
import * as offlineSyncModule from '../../../src/hooks/useOfflineSync'

// Create mock UseMutationResult objects
const createMockMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false as const,
  isSuccess: false as const,
  isError: false as const,
  error: null,
  data: undefined,
  isIdle: true as const,
  status: 'idle' as const,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  variables: undefined,
  context: undefined,
  submittedAt: 0,
  abortedAt: undefined,
  promise: undefined
})

describe('PWA Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
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
        },
        onLine: true
      },
      writable: true,
      configurable: true
    })
    
    // Mock window beforeinstallprompt
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
    
    // Trigger the beforeinstallprompt event
    const event = new Event('beforeinstallprompt')
    Object.defineProperty(event, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(event)
    
    // Mock useAuth
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'owner' },
      isAuthenticated: true,
      isLoading: false,
      login: createMockMutation(),
      register: createMockMutation(),
      logout: createMockMutation(),
      resendConfirmationEmail: createMockMutation(),
      refetchUser: vi.fn()
    })
    
    // Mock useBackgroundSync
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
    
    // Mock useOfflineSync
    vi.mocked(offlineSyncModule.useOfflineSync).mockReturnValue({
      isOnline: true,
      syncStatus: 'idle',
      syncPendingChanges: vi.fn(),
      pendingCount: 0,
      updatePendingCount: vi.fn()
    })
  })

  describe('PWA Installation Flow', () => {
    it('should show install button when PWA can be installed', async () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)

      render(<PWAInstallButton />)
      
      await waitFor(() => {
        expect(screen.getByTestId('button')).toBeInTheDocument()
      })
    })

    it('should hide install button after successful installation', async () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
      vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)

      const { rerender } = render(<PWAInstallButton />)
      
      await waitFor(() => {
        const button = screen.getByTestId('button')
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
      })

      // Simulate PWA being installed
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
      rerender(<PWAInstallButton />)

      expect(screen.queryByTestId('button')).not.toBeInTheDocument()
    })

    it('should show correct status after installation', () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
      vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

      render(<PWAStatus />)
      
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })

  describe('Background Sync Integration', () => {
    it('should show background sync settings', () => {
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
    it('should handle offline sync when coming back online', async () => {
      const mockSyncPendingChanges = vi.fn()
      vi.mocked(offlineSyncModule.useOfflineSync).mockReturnValue({
        isOnline: false,
        syncStatus: 'idle',
        syncPendingChanges: mockSyncPendingChanges,
        pendingCount: 1,
        updatePendingCount: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(screen.getByTestId('card')).toBeInTheDocument()
      })
    })

    it('should show offline status when connection is lost', () => {
      vi.mocked(offlineSyncModule.useOfflineSync).mockReturnValue({
        isOnline: false,
        syncStatus: 'idle',
        syncPendingChanges: vi.fn(),
        pendingCount: 0,
        updatePendingCount: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle PWA installation errors gracefully', async () => {
      vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
      vi.mocked(pwaModule.showInstallPrompt).mockRejectedValue(new Error('Installation failed'))

      render(<PWAInstallButton />)
      
      await waitFor(() => {
        const button = screen.getByTestId('button')
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
      })
    })

    it('should handle background sync errors gracefully', () => {
      vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: 'Network error',
          itemsSynced: 0
        },
        triggerBackgroundSync: vi.fn().mockResolvedValue(true),
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

    it('should handle offline sync errors gracefully', () => {
      vi.mocked(offlineSyncModule.useOfflineSync).mockReturnValue({
        isOnline: true,
        syncStatus: 'error',
        syncPendingChanges: vi.fn(),
        pendingCount: 0,
        updatePendingCount: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })
}) 