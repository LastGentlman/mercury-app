// PWA registration and utilities
export function registerPWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Register Background Sync
          registerBackgroundSync(registration)
          
          // Register Periodic Background Sync (if supported)
          registerPeriodicBackgroundSync(registration)
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update prompt
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// Register Background Sync
async function registerBackgroundSync(registration: ServiceWorkerRegistration) {
  if ('sync' in registration) {
    try {
      // Register background sync
      await (registration as any).sync.register('background-sync')
      console.log('✅ Background Sync registered')
    } catch (error) {
      console.log('❌ Background Sync registration failed:', error)
    }
  } else {
    console.log('⚠️ Background Sync not supported')
  }
}

// Register Periodic Background Sync
async function registerPeriodicBackgroundSync(registration: ServiceWorkerRegistration) {
  if ('periodicSync' in registration) {
    try {
      // Check if we have permission
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      })
      
      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('periodic-sync', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours minimum
        })
        console.log('✅ Periodic Background Sync registered')
      } else {
        console.log('⚠️ Periodic Background Sync permission not granted')
      }
    } catch (error) {
      console.log('❌ Periodic Background Sync registration failed:', error)
    }
  } else {
    console.log('⚠️ Periodic Background Sync not supported')
  }
}

// Check if app is installed as PWA
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

// Install prompt utilities
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    const installPrompt = (window as any).deferredPrompt
    if (installPrompt) {
      installPrompt.prompt()
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt')
          resolve(true)
        } else {
          console.log('User dismissed the install prompt')
          resolve(false)
        }
        ;(window as any).deferredPrompt = null
      })
    } else {
      resolve(false)
    }
  })
}

// Listen for install prompt
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    ;(window as any).deferredPrompt = e
  })
} 