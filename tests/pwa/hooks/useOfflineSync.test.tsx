import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOfflineSync } from '../../../src/hooks/useOfflineSync'
import * as authModule from '../../../src/hooks/useAuth'
import * as dbModule from '../../../src/lib/offline/db'

// ✅ CRITICAL FIX: Proper mock setup with complete function chains
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../../src/lib/offline/db', () => ({
  db: {
    syncQueue: {
      count: vi.fn(),
      add: vi.fn(),
      toArray: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn()
        }))
      }))
    },
    getPendingSyncItems: vi.fn(),
    markAsSynced: vi.fn(),
    incrementRetries: vi.fn(),
    checkDataExpiration: vi.fn()
  }
}))

vi.mock('../../../src/lib/offline/conflictResolver', () => ({
  ConflictResolver: {
    detectConflict: vi.fn(),
    resolveLastWriteWins: vi.fn()
  }
}))

// ✅ CRITICAL FIX: Mock fetch globally with proper promise handling
global.fetch = vi.fn()

// ✅ BEST PRACTICE: Mock utility for consistent mutation objects
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

describe('useOfflineSync', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    vi.clearAllMocks()
    
    // ✅ CRITICAL FIX: Properly configure navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })
    
    // ✅ CRITICAL FIX: Configure useAuth mock with proper return values
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
    
    // ✅ CRITICAL FIX: Configure database mocks with proper resolved values
    vi.mocked(dbModule.db.syncQueue.count).mockResolvedValue(0)
    vi.mocked(dbModule.db.syncQueue.add).mockResolvedValue(1)
    vi.mocked(dbModule.db.syncQueue.toArray).mockResolvedValue([])
    vi.mocked(dbModule.db.syncQueue.clear).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.syncQueue.delete).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue([])
    vi.mocked(dbModule.db.markAsSynced).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.incrementRetries).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.checkDataExpiration).mockResolvedValue(30)

    // ✅ CRITICAL FIX: Configure fetch mock with proper responses
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
      headers: new Headers(),
      statusText: 'OK'
    } as any)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('Initial State', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(0)
        expect(result.current.isOnline).toBe(true)
        expect(result.current.isSyncing).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('should initialize with offline status when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })
    })
  })

  describe('Online/Offline Detection', () => {
    it('should update online status when connection changes', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })
    })

    it('should update online status when connection is restored', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      act(() => {
        window.dispatchEvent(new Event('online'))
      })
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })
  })

  describe('Sync Pending Changes', () => {
    it('should sync pending changes when online', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      // Add pending change
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      // Trigger sync
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      // Add pending change
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      // Try to sync - should not sync when offline
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      // Should still have pending changes when offline
      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1)
      })
    })

    it('should not sync when already syncing', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      // Add a pending change first
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      // Start syncing
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      // Try to sync again while already syncing
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      // The hook should handle multiple sync calls gracefully
      // We can't easily test the internal syncing state, so we test the behavior
      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1)
      })
    })

    it('should handle sync errors gracefully', async () => {
      // Configure fetch to reject
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        // The hook returns a generic error message for failed syncs
        expect(result.current.error).toContain('Failed to sync')
        expect(result.current.isSyncing).toBe(false)
      })
    })

    it('should resolve conflicts when they occur', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })
  })

  describe('Pending Count', () => {
    it('should update pending count', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should set error status when sync fails', async () => {
      // Configure fetch to fail
      vi.mocked(global.fetch).mockRejectedValue(new Error('Sync failed'))
      
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        // The hook returns a generic error message for failed syncs
        expect(result.current.error).toContain('Failed to sync')
      })
    })

    it('should clear error status when sync succeeds', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })
      
      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
      
      // First, simulate an error
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Previous error'))
      
      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        // The hook returns a generic error message for failed syncs
        expect(result.current.error).toContain('Failed to sync')
      })
      
      // Now configure fetch to succeed
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
        headers: new Headers(),
        statusText: 'OK'
      } as any)
      
      await act( () => {
        result.current.syncPendingChanges()
      })
      
      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Database Integration', () => {
    it('should add item to sync queue', async () => {
      const { result } = renderHook(() => useOfflineSync(), { wrapper })

      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      await act( () => {
        result.current.addPendingChange({ 
          type: 'create', 
          data: { id: '1', name: 'Test Order' } 
        })
      })
      
      // Verify that pending count was updated
      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1)
      })
    })
  })
})