// PWA registration and utilities
export function registerPWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
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