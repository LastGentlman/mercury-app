import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundSyncSettings } from '../../../src/components/BackgroundSyncSettings'

// Mock background sync hook
vi.mock('../../../src/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn()
}))

// Mock permissions API
const mockPermissions = {
  query: vi.fn()
}

describe('BackgroundSyncSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator permissions
    Object.defineProperty(navigator, 'permissions', {
      value: mockPermissions,
      writable: true
    })
  })

  it('should render background sync settings', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByText(/background sync/i)).toBeInTheDocument()
    expect(screen.getByText(/sync settings/i)).toBeInTheDocument()
  })

  it('should show sync status when syncing', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: true,
        lastSyncTime: new Date().toISOString(),
        lastSyncError: null,
        itemsSynced: 5
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByText(/syncing/i)).toBeInTheDocument()
    expect(screen.getByText(/5 items/i)).toBeInTheDocument()
  })

  it('should show last sync time when available', () => {
    const lastSyncTime = new Date('2024-01-01T12:00:00Z').toISOString()
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime,
        lastSyncError: null,
        itemsSynced: 10
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByText(/last sync/i)).toBeInTheDocument()
    expect(screen.getByText(/10 items/i)).toBeInTheDocument()
  })

  it('should show sync error when present', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: 'Network error',
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    expect(screen.getByText(/error/i)).toBeInTheDocument()
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('should trigger manual sync when button is clicked', async () => {
    const mockTriggerBackgroundSync = vi.fn().mockResolvedValue(true)
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
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

  it('should request periodic sync when enabled', async () => {
    const mockRequestPeriodicSync = vi.fn().mockResolvedValue(true)
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: mockRequestPeriodicSync,
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    const periodicSyncToggle = screen.getByRole('checkbox', { name: /periodic sync/i })
    fireEvent.click(periodicSyncToggle)

    await waitFor(() => {
      expect(mockRequestPeriodicSync).toHaveBeenCalled()
    })
  })

  it('should show sync statistics', () => {
    const mockGetSyncStats = vi.fn().mockReturnValue({
      isEnabled: true,
      hasUser: true,
      lastSync: new Date(),
      errorCount: 0,
      totalItems: 25
    })
    
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: mockGetSyncStats
    })

    render(<BackgroundSyncSettings />)
    
    expect(mockGetSyncStats).toHaveBeenCalled()
  })

  it('should handle sync errors gracefully', async () => {
    const mockTriggerBackgroundSync = vi.fn().mockRejectedValue(new Error('Sync failed'))
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
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

    // Should not crash
    await waitFor(() => {
      expect(mockTriggerBackgroundSync).toHaveBeenCalled()
    })
  })

  it('should disable sync button when syncing', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: true,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    const syncButton = screen.getByRole('button', { name: /sync now/i })
    expect(syncButton).toBeDisabled()
  })

  it('should show sync progress indicator', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
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
    
    expect(screen.getByTestId('sync-progress')).toBeInTheDocument()
    expect(screen.getByText(/3 items/i)).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    const mockUseBackgroundSync = require('../../../src/hooks/useBackgroundSync').useBackgroundSync
    mockUseBackgroundSync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSyncTime: null,
        lastSyncError: null,
        itemsSynced: 0
      },
      triggerBackgroundSync: vi.fn(),
      requestPeriodicSync: vi.fn(),
      getSyncStats: vi.fn()
    })

    render(<BackgroundSyncSettings />)
    
    const syncButton = screen.getByRole('button', { name: /sync now/i })
    expect(syncButton).toHaveAttribute('aria-label')
  })
}) 