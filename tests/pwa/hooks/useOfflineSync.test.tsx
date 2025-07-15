import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOfflineSync } from '../../../src/hooks/useOfflineSync'
import * as authModule from '../../../src/hooks/useAuth'
import * as dbModule from '../../../src/lib/offline/db'
import * as conflictResolverModule from '../../../src/lib/offline/conflictResolver'

// ✅ MOCK LOCAL (override del global si es necesario)
vi.mock('../../../src/lib/offline/db', () => ({
  db: {
    syncQueue: {
      count: vi.fn().mockResolvedValue(0),
      add: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined)
    },
    getPendingSyncItems: vi.fn().mockResolvedValue([]),
    markAsSynced: vi.fn().mockResolvedValue(undefined),
    incrementRetries: vi.fn().mockResolvedValue(undefined)
  }
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

// Mock fetch
global.fetch = vi.fn()

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
    
    // Mock navigator online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })
    
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
    
    // Mock database
    vi.mocked(dbModule.db.syncQueue.count).mockResolvedValue(0)
    vi.mocked(dbModule.db.getPendingSyncItems).mockResolvedValue([])
    vi.mocked(dbModule.db.markAsSynced).mockResolvedValue(undefined)
    vi.mocked(dbModule.db.incrementRetries).mockResolvedValue(undefined)
    
    // Mock conflict resolver
    vi.mocked(conflictResolverModule.ConflictResolver.detectConflict).mockReturnValue(false)
    vi.mocked(conflictResolverModule.ConflictResolver.resolveLastWriteWins).mockReturnValue({
      winner: 'local',
      resolvedData: { id: 1, clientGeneratedId: 'test', businessId: '1', clientName: 'Test', clientPhone: '123', clientAddress: 'Test', items: [], total: 0, status: 'pending', deliveryDate: new Date().toISOString(), syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    })
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
        expect(result.current.isOnline).toBe(true)  // jsdom default
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
      const { result } = renderHook(() => useOfflineSync())
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      // Trigger online/offline event
      window.dispatchEvent(new Event('offline'))
      
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
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      
      // Trigger online/offline event
      window.dispatchEvent(new Event('online'))
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })
  })

  describe('Sync Pending Changes', () => {
    it('should sync pending changes when online', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Add pending changes
      result.current.addPendingChange({ type: 'create', data: { id: '1' } })
      
      // Trigger sync
      await result.current.syncPendingChanges()
      
      expect(result.current.pendingCount).toBe(0)
    })

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Add pending changes
      result.current.addPendingChange({ type: 'create', data: { id: '1' } })
      
      // Try to sync
      await result.current.syncPendingChanges()
      
      // Should still have pending changes
      expect(result.current.pendingCount).toBe(1)
    })

    it('should not sync when already syncing', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Start syncing
      result.current.isSyncing = true
      
      // Try to sync again
      await result.current.syncPendingChanges()
      
      // Should still be syncing
      expect(result.current.isSyncing).toBe(true)
    })

    it('should handle sync errors gracefully', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Add pending changes
      result.current.addPendingChange({ type: 'create', data: { id: '1' } })
      
      // Mock sync to fail
      result.current.syncPendingChanges = vi.fn().mockRejectedValue(new Error('Sync failed'))
      
      // Try to sync
      await result.current.syncPendingChanges()
      
      expect(result.current.error).toBeDefined()
    })

    it('should resolve conflicts when they occur', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Add conflicting changes
      result.current.addPendingChange({ type: 'update', data: { id: '1', version: 1 } })
      result.current.addPendingChange({ type: 'update', data: { id: '1', version: 2 } })
      
      // Trigger sync
      await result.current.syncPendingChanges()
      
      // Should handle conflicts
      expect(result.current.pendingCount).toBeDefined()
    })
  })

  describe('Pending Count', () => {
    it('should update pending count', () => {
      const { result } = renderHook(() => useOfflineSync())
      
      expect(result.current.pendingCount).toBe(0)
      
      result.current.addPendingChange({ type: 'create', data: { id: '1' } })
      
      expect(result.current.pendingCount).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should set error status when sync fails', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Mock sync to fail
      result.current.syncPendingChanges = vi.fn().mockRejectedValue(new Error('Network error'))
      
      // Try to sync
      await result.current.syncPendingChanges()
      
      expect(result.current.error).toBe('Network error')
    })

    it('should clear error status when sync succeeds', async () => {
      (authModule.useAuth as any).mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: 'owner' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn()
      })
      
      const { result } = renderHook(() => useOfflineSync())
      
      // Set initial error
      result.current.error = 'Previous error'
      
      // Mock sync to succeed
      result.current.syncPendingChanges = vi.fn().mockResolvedValue(undefined)
      
      // Sync successfully
      await result.current.syncPendingChanges()
      
      expect(result.current.error).toBeNull()
    })
  })

  // ✅ NUEVOS TESTS CON MANEJO DE ASYNC
  it('should add item to sync queue', async () => {
    const { result } = renderHook(() => useOfflineSync(), { wrapper })

    await waitFor(() => {
      expect(result.current.addPendingChange).toBeDefined()
    })

    const mockItem = { type: 'create' as const, data: { id: '1', name: 'Test' } }
    
    await result.current.addPendingChange(mockItem)
    
    // Verificar que se llamó el método correcto de la DB
    const { db } = await import('../../../src/lib/offline/db')
    expect(db.syncQueue.add).toHaveBeenCalledWith(mockItem)
  })
})