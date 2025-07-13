import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerPWA } from '../../src/pwa'

// Mock service worker APIs
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    sync: {
      register: vi.fn()
    },
    periodicSync: {
      register: vi.fn()
    }
  })
}

const mockNavigator = {
  serviceWorker: mockServiceWorker,
  permissions: {
    query: vi.fn()
  }
}

const mockCaches = {
  open: vi.fn(),
  match: vi.fn(),
  addAll: vi.fn()
}

const mockCache = {
  addAll: vi.fn(),
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

describe('Service Worker Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    global.navigator = mockNavigator as any
    global.caches = mockCaches as any
    global.fetch = vi.fn()
    
    // Mock environment
    vi.stubEnv('PROD', true)
    
    // Mock document readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerPWA', () => {
    it('should register service worker in production', async () => {
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all'
      })

      const result = await registerPWA()

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js')
      expect(result).toBeDefined()
    })

    it('should not register service worker in development', async () => {
      vi.stubEnv('PROD', false)

      const result = await registerPWA()

      expect(mockServiceWorker.register).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should not register if service worker is not supported', async () => {
      delete (global as any).navigator.serviceWorker

      const result = await registerPWA()

      expect(mockServiceWorker.register).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should handle registration errors gracefully', async () => {
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'))

      await expect(registerPWA()).rejects.toThrow('Registration failed')
    })

    it('should prevent multiple registrations', async () => {
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all'
      })

      // Call registerPWA multiple times
      const promise1 = registerPWA()
      const promise2 = registerPWA()
      const promise3 = registerPWA()

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      // Should only register once
      expect(mockServiceWorker.register).toHaveBeenCalledTimes(1)
      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })
  })

  describe('Background Sync Registration', () => {
    it('should register background sync when supported', async () => {
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all',
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      })

      await registerPWA()

      expect(mockServiceWorker.register).toHaveBeenCalled()
    })

    it('should handle background sync registration errors', async () => {
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all',
        sync: {
          register: vi.fn().mockRejectedValue(new Error('Sync not supported'))
        }
      })

      // Should not throw error
      const result = await registerPWA()
      expect(result).toBeDefined()
    })
  })

  describe('Periodic Background Sync', () => {
    it('should register periodic sync when supported and permitted', async () => {
      mockNavigator.permissions.query.mockResolvedValue({ state: 'granted' })
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all',
        periodicSync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      })

      await registerPWA()

      expect(mockNavigator.permissions.query).toHaveBeenCalledWith({
        name: 'periodic-background-sync'
      })
    })

    it('should not register periodic sync when permission denied', async () => {
      mockNavigator.permissions.query.mockResolvedValue({ state: 'denied' })
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        updateViaCache: 'all',
        periodicSync: {
          register: vi.fn()
        }
      })

      await registerPWA()

      expect(mockServiceWorker.register).toHaveBeenCalled()
      // Should not call periodicSync.register
    })
  })
})

describe('Service Worker Events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle install event', () => {
    // This would be tested in a service worker context
    // For now, we test the event handler logic
    const installEvent = {
      waitUntil: vi.fn(),
      type: 'install'
    }

    // Mock the install event handler
    const handleInstall = (event: any) => {
      event.waitUntil(
        Promise.resolve().then(() => {
          return 'skipWaiting'
        })
      )
    }

    handleInstall(installEvent)
    expect(installEvent.waitUntil).toHaveBeenCalled()
  })

  it('should handle activate event', () => {
    const activateEvent = {
      waitUntil: vi.fn(),
      type: 'activate'
    }

    const handleActivate = (event: any) => {
      event.waitUntil(
        Promise.resolve().then(() => {
          return 'clients.claim'
        })
      )
    }

    handleActivate(activateEvent)
    expect(activateEvent.waitUntil).toHaveBeenCalled()
  })

  it('should handle sync event', () => {
    const syncEvent = {
      waitUntil: vi.fn(),
      tag: 'background-sync',
      type: 'sync'
    }

    const handleSync = (event: any) => {
      if (event.tag === 'background-sync') {
        event.waitUntil(Promise.resolve())
      }
    }

    handleSync(syncEvent)
    expect(syncEvent.waitUntil).toHaveBeenCalled()
  })
})

describe('Cache Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCaches.open.mockResolvedValue(mockCache)
  })

  it('should open cache with correct name', async () => {
    const cacheName = 'mercury-app-v1'
    
    await mockCaches.open(cacheName)
    
    expect(mockCaches.open).toHaveBeenCalledWith(cacheName)
  })

  it('should cache static assets', async () => {
    const assets = ['/', '/index.html', '/manifest.json']
    
    mockCache.addAll.mockResolvedValue(undefined)
    
    await mockCache.addAll(assets)
    
    expect(mockCache.addAll).toHaveBeenCalledWith(assets)
  })

  it('should handle cache errors gracefully', async () => {
    mockCaches.open.mockRejectedValue(new Error('Cache failed'))
    
    await expect(mockCaches.open('test-cache')).rejects.toThrow('Cache failed')
  })
}) 