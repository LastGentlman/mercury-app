// src/pwa.ts - FIXED VERSION (Crash-Safe)

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
let isRegistering = false;

// PWA registration with proper error handling and debouncing
export function registerPWA() {
  // Prevent multiple registrations
  if (isRegistering || registrationPromise) {
    return registrationPromise;
  }

  // Only register in production and if service worker is supported
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    console.log('⚠️ Service Worker not supported or not in production mode');
    return Promise.resolve(null);
  }

  isRegistering = true;

  registrationPromise = new Promise((resolve, reject) => {
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('✅ SW registered:', registration);
          
          try {
            // Register Background Sync with error handling
            await registerBackgroundSync(registration);
            
            // Register Periodic Background Sync with error handling
            await registerPeriodicBackgroundSync(registration);
            
            // Handle updates with proper error handling
            setupUpdateHandler(registration);
            
            resolve(registration);
          } catch (error) {
            console.error('❌ Post-registration setup failed:', error);
            resolve(registration); // Still resolve as registration succeeded
          }
        })
        .catch((registrationError) => {
          console.error('❌ SW registration failed:', registrationError);
          reject(registrationError);
        })
        .finally(() => {
          isRegistering = false;
        });
    };

    // Register on load or immediately if already loaded
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerSW, { once: true });
    } else {
      registerSW();
    }
  });

  return registrationPromise;
}

// Setup update handler with proper cleanup
function setupUpdateHandler(registration: ServiceWorkerRegistration) {
  try {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        const stateChangeHandler = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update prompt
            const shouldUpdate = confirm('New version available! Reload to update?');
            if (shouldUpdate) {
              window.location.reload();
            }
          }
          
          // Clean up listener when worker is activated or redundant
          if (newWorker.state === 'activated' || newWorker.state === 'redundant') {
            newWorker.removeEventListener('statechange', stateChangeHandler);
          }
        };

        newWorker.addEventListener('statechange', stateChangeHandler);
      }
    });
  } catch (error) {
    console.error('❌ Update handler setup failed:', error);
  }
}

// Enhanced PWA detection with safety checks
export function isPWAInstalled(): boolean {
  try {
    // Method 1: Check display-mode (most reliable)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Method 2: iOS Safari specific
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // Method 3: Check URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const isLaunchedFromHomeScreen = searchParams.get('utm_source') === 'pwa';
    const hasStartUrlParam = searchParams.get('source') === 'pwa';

    const isPWA = isStandalone || isIOSStandalone || isLaunchedFromHomeScreen || hasStartUrlParam;

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('🔍 PWA Detection:', {
        isStandalone,
        isIOSStandalone,
        isLaunchedFromHomeScreen,
        hasStartUrlParam,
        isPWA,
        userAgent: navigator.userAgent.substring(0, 100), // Limit length
        displayMode: window.matchMedia('(display-mode: standalone)').media
      });
    }

    return isPWA;
  } catch (error) {
    console.error('❌ PWA detection failed:', error);
    return false;
  }
}

// Safe PWA launch method detection
export function getPWALaunchMethod(): 'browser' | 'installed' | 'unknown' {
  try {
    if (isPWAInstalled()) {
      return 'installed';
    }
    
    if (window.matchMedia('(display-mode: browser)').matches) {
      return 'browser';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('❌ Launch method detection failed:', error);
    return 'unknown';
  }
}

// Safe localStorage operations
export function markAsInstalledPWA() {
  try {
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-install-date', new Date().toISOString());
  } catch (error) {
    console.error('❌ Failed to mark PWA as installed:', error);
  }
}

export function wasEverInstalledAsPWA(): boolean {
  try {
    return localStorage.getItem('pwa-installed') === 'true';
  } catch (error) {
    console.error('❌ Failed to check PWA installation status:', error);
    return false;
  }
}

// Background Sync registration with proper error handling
async function registerBackgroundSync(registration: ServiceWorkerRegistration) {
  try {
    if ('sync' in registration) {
      await (registration as any).sync.register('background-sync');
      console.log('✅ Background Sync registered');
    } else {
      console.log('⚠️ Background Sync not supported');
    }
  } catch (error) {
    console.error('❌ Background Sync registration failed:', error);
    // Don't throw - this is not critical for PWA functionality
  }
}

// Periodic Background Sync registration with proper error handling
async function registerPeriodicBackgroundSync(registration: ServiceWorkerRegistration) {
  try {
    if ('periodicSync' in registration) {
      // Check permissions first
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      });
      
      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('periodic-sync', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours minimum
        });
        console.log('✅ Periodic Background Sync registered');
      } else {
        console.log('⚠️ Periodic Background Sync permission not granted');
      }
    } else {
      console.log('⚠️ Periodic Background Sync not supported');
    }
  } catch (error) {
    console.error('❌ Periodic Background Sync registration failed:', error);
    // Don't throw - this is not critical for PWA functionality
  }
}

// Install prompt utilities with proper error handling
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const installPrompt = (window as any).deferredPrompt;
      
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice
          .then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('✅ User accepted the install prompt');
              markAsInstalledPWA();
              resolve(true);
            } else {
              console.log('⚠️ User dismissed the install prompt');
              resolve(false);
            }
            // Clean up
            (window as any).deferredPrompt = null;
          })
          .catch((error: any) => {
            console.error('❌ Install prompt failed:', error);
            resolve(false);
          });
      } else {
        console.log('⚠️ No install prompt available');
        resolve(false);
      }
    } catch (error) {
      console.error('❌ Show install prompt failed:', error);
      resolve(false);
    }
  });
}

// Install prompt listener with proper cleanup
let beforeInstallPromptListener: ((e: Event) => void) | null = null;
let appInstalledListener: (() => void) | null = null;

export function listenForInstallPrompt() {
  try {
    // Remove existing listeners to prevent duplicates
    if (beforeInstallPromptListener) {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptListener);
    }
    if (appInstalledListener) {
      window.removeEventListener('appinstalled', appInstalledListener);
    }

    // Create new listeners
    beforeInstallPromptListener = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };

    appInstalledListener = () => {
      console.log('📱 PWA was installed');
      markAsInstalledPWA();
      (window as any).deferredPrompt = null;
    };

    // Add listeners
    window.addEventListener('beforeinstallprompt', beforeInstallPromptListener);
    window.addEventListener('appinstalled', appInstalledListener);
    
  } catch (error) {
    console.error('❌ Install prompt listener setup failed:', error);
  }
}

// Cleanup function for when component unmounts
export function cleanupPWAListeners() {
  try {
    if (beforeInstallPromptListener) {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptListener);
      beforeInstallPromptListener = null;
    }
    if (appInstalledListener) {
      window.removeEventListener('appinstalled', appInstalledListener);
      appInstalledListener = null;
    }
  } catch (error) {
    console.error('❌ PWA listeners cleanup failed:', error);
  }
} 