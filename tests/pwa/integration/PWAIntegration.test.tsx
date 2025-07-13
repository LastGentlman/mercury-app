import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'
import { PWAStatus } from '../../../src/components/PWAStatus'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'
import { usePWARoute } from '../../../src/hooks/usePWARoute'
import { useBackgroundSync as _useBackgroundSync } from '../../../src/hooks/useBackgroundSync'
import { useOfflineSync as _useOfflineSync } from '../../../src/hooks/useOfflineSync'

// Mock all PWA utilities
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn(),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(),
  registerPWA: vi.fn()
}))

// Mock hooks
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn()
}))

vi.mock('../../../src/hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn()
}))

vi.mock('../../../src/hooks/useCSRF', () => ({
  useCSRFRequest: vi.fn()
}))

// Mock service worker
const mockServiceWorker = {
  ready: Promise.resolve({
    sync: {
      register: vi.fn()
    },
    periodicSync: {
      register: vi.fn()
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Mock beforeinstallprompt
const mockBeforeInstallPrompt = {
  prompt: vi.fn(),
  userChoice: Promise.resolve({ outcome: 'accepted' })
}

describe('PWA Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    global.navigator = {
      serviceWorker: mockServiceWorker,
      permissions: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      onLine: true
    } as any
    
    // Mock window beforeinstallprompt
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: mockBeforeInstallPrompt,
      writable: true
    })
    
    // Mock useAuth
    const { useAuth } = require('../../../src/hooks/useAuth')
    useAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false
    })
    
    // Mock useBackgroundSync
    const { useBackgroundSync } = require('../../../src/hooks/useBackgroundSync')
    useBackgroundSync.mockReturnValue({
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
    
    // Mock useOfflineSync
    const { useOfflineSync } = require('../../../src/hooks/useOfflineSync')
    useOfflineSync.mockReturnValue({
      isOnline: true,
      syncStatus: 'idle',
      pendingCount: 0,
      syncPendingChanges: vi.fn()
    })
  })

  describe('PWA Installation Flow', () => {
    it('should show install button when PWA can be installed', () => {
      const { isPWAInstalled } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(false)

      render(<PWAInstallButton />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText(/install/i)).toBeInTheDocument()
    })

    it('should hide install button after successful installation', async () => {
      const { isPWAInstalled, markAsInstalledPWA } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(false)

      const { rerender } = render(<PWAInstallButton />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(markAsInstalledPWA).toHaveBeenCalled()
      })

      // Simulate PWA being installed
      isPWAInstalled.mockReturnValue(true)
      rerender(<PWAInstallButton />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should show correct status after installation', () => {
      const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(true)
      getPWALaunchMethod.mockReturnValue('installed')

      render(<PWAStatus />)
      
      expect(screen.getByText(/pwa/i)).toBeInTheDocument()
      expect(screen.getByText(/installed/i)).toBeInTheDocument()
    })
  })

  describe('PWA Route Handling', () => {
    it('should redirect to auth when PWA is installed but user is not authenticated', async () => {
      const { isPWAInstalled } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(true)

      const { useAuth } = require('../../../src/hooks/useAuth')
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })

      const mockNavigate = vi.fn()
      vi.mock('@tanstack/react-router', () => ({
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/' })
      }))

      renderHook(() => usePWARoute())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
      })
    })

    it('should not redirect when user is authenticated in PWA', async () => {
      const { isPWAInstalled } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(true)

      const { useAuth } = require('../../../src/hooks/useAuth')
      useAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false
      })

      const mockNavigate = vi.fn()
      vi.mock('@tanstack/react-router', () => ({
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/' })
      }))

      renderHook(() => usePWARoute())

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Background Sync Integration', () => {
    it('should show background sync settings when PWA is installed', () => {
      const { isPWAInstalled } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(true)

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByText(/background sync/i)).toBeInTheDocument()
      expect(screen.getByText(/sync settings/i)).toBeInTheDocument()
    })

    it('should trigger background sync when manual sync is requested', async () => {
      const { useBackgroundSync } = require('../../../src/hooks/useBackgroundSync')
      const mockTriggerBackgroundSync = vi.fn().mockResolvedValue(true)
      useBackgroundSync.mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: null,
          itemsSynced: 0
        },
        triggerBackgroundSync: mockTriggerBackgroundSync,
        requestPeriodicSync: vi.fn(),
        getSyncStats: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      const syncButton = screen.getByRole('button', { name: /sync now/i })
      fireEvent.click(syncButton)

      await waitFor(() => {
        expect(mockTriggerBackgroundSync).toHaveBeenCalled()
      })
    })

    it('should show sync progress during background sync', () => {
      const { useBackgroundSync } = require('../../../src/hooks/useBackgroundSync')
      useBackgroundSync.mockReturnValue({
        syncStatus: {
          isSyncing: true,
          lastSyncTime: null,
          lastSyncError: null,
          itemsSynced: 3
        },
        triggerBackgroundSync: vi.fn(),
        requestPeriodicSync: vi.fn(),
        getSyncStats: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      expect(screen.getByText(/3 items/i)).toBeInTheDocument()
    })
  })

  describe('Offline Sync Integration', () => {
    it('should show offline status when connection is lost', () => {
      const { useOfflineSync } = require('../../../src/hooks/useOfflineSync')
      useOfflineSync.mockReturnValue({
        isOnline: false,
        syncStatus: 'idle',
        pendingCount: 2,
        syncPendingChanges: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
      expect(screen.getByText(/2 pending/i)).toBeInTheDocument()
    })

    it('should trigger sync when coming back online', async () => {
      const { useOfflineSync } = require('../../../src/hooks/useOfflineSync')
      const mockSyncPendingChanges = vi.fn()
      useOfflineSync.mockReturnValue({
        isOnline: true,
        syncStatus: 'syncing',
        pendingCount: 1,
        syncPendingChanges: mockSyncPendingChanges
      })

      render(<BackgroundSyncSettings />)
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })
      
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(mockSyncPendingChanges).toHaveBeenCalled()
      })
    })
  })

  describe('PWA Status Integration', () => {
    it('should show correct launch method in different scenarios', () => {
      const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
      
      // Test browser mode
      isPWAInstalled.mockReturnValue(false)
      getPWALaunchMethod.mockReturnValue('browser')

      const { rerender } = render(<PWAStatus />)
      expect(screen.getByText(/browser/i)).toBeInTheDocument()

      // Test PWA mode
      isPWAInstalled.mockReturnValue(true)
      getPWALaunchMethod.mockReturnValue('installed')

      rerender(<PWAStatus />)
      expect(screen.getByText(/installed/i)).toBeInTheDocument()
    })

    it('should handle unknown launch method', () => {
      const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(false)
      getPWALaunchMethod.mockReturnValue('unknown')

      render(<PWAStatus />)
      
      expect(screen.getByText(/unknown/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle installation errors gracefully', async () => {
      const { isPWAInstalled } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(false)
      
      mockBeforeInstallPrompt.prompt.mockRejectedValue(new Error('Installation failed'))

      render(<PWAInstallButton />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      // Should not crash
      await waitFor(() => {
        expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled()
      })
    })

    it('should handle sync errors gracefully', () => {
      const { useBackgroundSync } = require('../../../src/hooks/useBackgroundSync')
      useBackgroundSync.mockReturnValue({
        syncStatus: {
          isSyncing: false,
          lastSyncTime: null,
          lastSyncError: 'Network error',
          itemsSynced: 0
        },
        triggerBackgroundSync: vi.fn().mockRejectedValue(new Error('Sync failed')),
        requestPeriodicSync: vi.fn(),
        getSyncStats: vi.fn()
      })

      render(<BackgroundSyncSettings />)
      
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  describe('PWA Feature Detection', () => {
    it('should detect PWA features correctly', () => {
      const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
      isPWAInstalled.mockReturnValue(true)
      getPWALaunchMethod.mockReturnValue('installed')

      // Test PWA detection
      expect(isPWAInstalled()).toBe(true)
      expect(getPWALaunchMethod()).toBe('installed')
    })

    it('should handle missing PWA features gracefully', () => {
      // Remove service worker support
      delete (global as any).navigator.serviceWorker

      const { registerPWA } = require('../../../src/pwa')
      
      // Should not crash when service worker is not supported
      expect(() => registerPWA()).not.toThrow()
    })
  })
}) 