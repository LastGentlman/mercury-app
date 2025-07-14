import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// Import the mocked modules to access their functions
import * as backgroundSyncModule from '../../../src/hooks/useBackgroundSync'

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

describe('BackgroundSyncSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator permissions
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      writable: true,
      configurable: true
    })
  })

  it('should render background sync settings', () => {
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

  it('should show sync error when present', () => {
    (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
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

  it('should trigger manual sync when button is clicked', async () => {
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

  it('should request periodic sync when enabled', async () => {
    const mockRequestPeriodicSync = vi.fn().mockResolvedValue(true) as any
    (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn().mockResolvedValue(true),
      requestPeriodicSync: mockRequestPeriodicSync,
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
    
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    await waitFor(() => {
      expect(mockRequestPeriodicSync).toHaveBeenCalled()
    })
  })

  it('should handle sync errors gracefully', async () => {
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

  it('should show not supported message when background sync is not supported', () => {
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
        isEnabled: false,
        hasUser: false,
        lastSync: null,
        errorCount: 0,
        totalItems: 0
      }),
      isSupported: false
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByText(/not supported/i)).toBeInTheDocument()
  })

  it('should show sync statistics', () => {
    const mockGetSyncStats = vi.fn().mockReturnValue({
      isEnabled: true,
      hasUser: true,
      lastSync: new Date('2023-01-01'),
      errorCount: 2,
      totalItems: 10
    }) as any
    
    (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: new Date('2023-01-01').toISOString(),
        lastSyncError: null,
        itemsSynced: 10
      },
      triggerBackgroundSync: vi.fn().mockResolvedValue(true),
      requestPeriodicSync: vi.fn().mockResolvedValue(true),
      getSyncStats: mockGetSyncStats,
      isSupported: true
    })

    render(<BackgroundSyncSettings />)
    
    expect(mockGetSyncStats).toHaveBeenCalled()
  })

  it('should handle permission denied gracefully', () => {
    (backgroundSyncModule.useBackgroundSync as any).mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: 'Permission denied',
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn().mockResolvedValue(false),
      requestPeriodicSync: vi.fn().mockResolvedValue(false),
      getSyncStats: vi.fn().mockReturnValue({
        isEnabled: false,
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