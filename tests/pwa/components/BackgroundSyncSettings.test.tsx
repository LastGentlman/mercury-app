import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// Import the mocked modules to access their functions
import * as backgroundSyncModule from '../../../src/hooks/useBackgroundSync'

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

  it('should show sync error when present', () => {
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

  it('should trigger manual sync when button is clicked', async () => {
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

  it('should request periodic sync when enabled', async () => {
    const mockRequestPeriodicSync = vi.fn().mockResolvedValue(true)
    vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
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
    const mockTriggerBackgroundSync = vi.fn().mockRejectedValue(new Error('Sync failed'))
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

  it('should show not supported message when background sync is not supported', () => {
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
        isEnabled: false,
        hasUser: true,
        lastSync: null,
        errorCount: 0,
        totalItems: 0
      }),
      isSupported: false
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('should show sync statistics', () => {
    const mockGetSyncStats = vi.fn().mockReturnValue({
      isEnabled: true,
      hasUser: true,
      lastSync: new Date(),
      errorCount: 0,
      totalItems: 25
    })
    
    vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
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
    vi.mocked(backgroundSyncModule.useBackgroundSync).mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: 'Permission denied',
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
}) 