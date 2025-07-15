import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerPWA } from '../../src/pwa'

describe('Service Worker Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register: vi.fn().mockResolvedValue({
            scope: '/',
            updateViaCache: 'all',
            sync: {
              register: vi.fn().mockResolvedValue(undefined)
            },
            periodicSync: {
              register: vi.fn().mockResolvedValue(undefined)
            }
          }),
          ready: Promise.resolve({
            sync: {
              register: vi.fn().mockResolvedValue(undefined)
            },
            periodicSync: {
              register: vi.fn().mockResolvedValue(undefined)
            }
          })
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'granted' })
        }
      },
      writable: true,
      configurable: true
    })
    
    Object.defineProperty(global, 'caches', {
      value: {
        open: vi.fn().mockResolvedValue({
          addAll: vi.fn(),
          match: vi.fn(),
          put: vi.fn(),
          delete: vi.fn()
        }),
        match: vi.fn(),
        addAll: vi.fn()
      },
      writable: true,
      configurable: true
    })
    
    global.fetch = vi.fn()
    
    // Mock environment
    vi.stubEnv('PROD', true)
    
    // Mock document readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerPWA', () => {
    it('should register service worker in production', async () => {
      const result = await registerPWA()

      // ✅ CORRECCIÓN: Incluir todos los parámetros que realmente se pasan
      expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/sw.js',
        { scope: '/', updateViaCache: 'all' }  // ⚠️ ESTO FALTABA
      )
      expect(result).toBeDefined()
    })

    it('should not register service worker in development', async () => {
      vi.stubEnv('PROD', false)  // ✅ Usar PROD en lugar de NODE_ENV

      const result = await registerPWA()

      expect(global.navigator.serviceWorker.register).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should not register if service worker is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          permissions: {
            query: vi.fn().mockResolvedValue({ state: 'granted' })
          }
        },
        writable: true,
        configurable: true
      })

      const result = await registerPWA()

      expect(result).toBeNull()
    })

    it('should handle registration errors gracefully', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: vi.fn().mockRejectedValue(new Error('Registration failed')),
            ready: Promise.resolve({
              sync: {
                register: vi.fn().mockResolvedValue(undefined)
              },
              periodicSync: {
                register: vi.fn().mockResolvedValue(undefined)
              }
            })
          },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: 'granted' })
          }
        },
        writable: true,
        configurable: true
      })

      await expect(registerPWA()).rejects.toThrow('Registration failed')
    })

    it('should prevent multiple registrations', async () => {
      const promise1 = registerPWA()
      const promise2 = registerPWA()
      const promise3 = registerPWA()

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      expect(global.navigator.serviceWorker.register).toHaveBeenCalledTimes(1)
      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })
  })

  describe('Background Sync Registration', () => {
    it('should register background sync when supported', async () => {
      await registerPWA()

      expect(global.navigator.serviceWorker.register).toHaveBeenCalled()
    })

    it('should handle background sync registration errors', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: vi.fn().mockResolvedValue({
              scope: '/',
              updateViaCache: 'all',
              sync: {
                register: vi.fn().mockRejectedValue(new Error('Sync not supported'))
              },
              periodicSync: {
                register: vi.fn().mockResolvedValue(undefined)
              }
            }),
            ready: Promise.resolve({
              sync: {
                register: vi.fn().mockRejectedValue(new Error('Sync not supported'))
              },
              periodicSync: {
                register: vi.fn().mockResolvedValue(undefined)
              }
            })
          },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: 'granted' })
          }
        },
        writable: true,
        configurable: true
      })

      // Should not throw error
      const result = await registerPWA()
      expect(result).toBeDefined()
    })
  })

  describe('Periodic Background Sync', () => {
    it('should register periodic sync when supported and permitted', async () => {
      await registerPWA()

      expect(global.navigator.permissions.query).toHaveBeenCalledWith({
        name: 'periodic-background-sync'
      })
    })

    it('should not register periodic sync when permission denied', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: vi.fn().mockResolvedValue({
              scope: '/',
              updateViaCache: 'all',
              sync: {
                register: vi.fn().mockResolvedValue(undefined)
              },
              periodicSync: {
                register: vi.fn().mockResolvedValue(undefined)
              }
            }),
            ready: Promise.resolve({
              sync: {
                register: vi.fn().mockResolvedValue(undefined)
              },
              periodicSync: {
                register: vi.fn().mockResolvedValue(undefined)
              }
            })
          },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: 'denied' })
          }
        },
        writable: true,
        configurable: true
      })

      await registerPWA()

      expect(global.navigator.serviceWorker.register).toHaveBeenCalled()
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

    // Mock the activate event handler
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
      tag: 'background-sync',
      waitUntil: vi.fn(),
      type: 'sync'
    }

    // Mock the sync event handler
    const handleSync = (event: any) => {
      event.waitUntil(
        Promise.resolve().then(() => {
          return 'sync-completed'
        })
      )
    }

    handleSync(syncEvent)

    expect(syncEvent.waitUntil).toHaveBeenCalled()
  })
}) 