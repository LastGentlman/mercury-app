// src/pwa.ts - Enhanced version with better PWA detection

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

// Enhanced PWA detection
export function isPWAInstalled(): boolean {
  // Method 1: Check display-mode (most reliable)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  // Method 2: iOS Safari specific
  const isIOSStandalone = (window.navigator as any).standalone === true

  // Method 3: Check if launched from home screen (Android)
  const isLaunchedFromHomeScreen = window.location.search.includes('utm_source=pwa')

  // Method 4: Check start_url parameter (if you add it to manifest)
  const hasStartUrlParam = window.location.search.includes('source=pwa')

  const isPWA = isStandalone || isIOSStandalone || isLaunchedFromHomeScreen || hasStartUrlParam

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('🔍 PWA Detection:', {
      isStandalone,
      isIOSStandalone,
      isLaunchedFromHomeScreen,
      hasStartUrlParam,
      isPWA,
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').media
    })
  }

  return isPWA
}

// Get PWA launch method
export function getPWALaunchMethod(): 'browser' | 'installed' | 'unknown' {
  if (isPWAInstalled()) {
    return 'installed'
  }
  
  // Check if opened in browser
  if (window.matchMedia('(display-mode: browser)').matches) {
    return 'browser'
  }
  
  return 'unknown'
}

// Store PWA installation state
export function markAsInstalledPWA() {
  localStorage.setItem('pwa-installed', 'true')
  localStorage.setItem('pwa-install-date', new Date().toISOString())
}

// Check if user has previously installed PWA
export function wasEverInstalledAsPWA(): boolean {
  return localStorage.getItem('pwa-installed') === 'true'
}

// Register Background Sync
async function registerBackgroundSync(registration: ServiceWorkerRegistration) {
  if ('sync' in registration) {
    try {
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

// Install prompt utilities
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    const installPrompt = (window as any).deferredPrompt
    if (installPrompt) {
      installPrompt.prompt()
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt')
          markAsInstalledPWA() // Mark as installed
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

  // Listen for app install event
  window.addEventListener('appinstalled', () => {
    console.log('📱 PWA was installed')
    markAsInstalledPWA()
    ;(window as any).deferredPrompt = null
  })
} 