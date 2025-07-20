// src/pwa-fixed.ts - CRASH-SAFE VERSION

// ✅ Variables de control para prevenir crashes
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let isRegistering = false;
let lastRegistrationAttempt = 0;
const REGISTRATION_DEBOUNCE_MS = 2000; // 2 segundos de debounce
const MAX_REGISTRATION_ATTEMPTS = 2; // Reducido para prevenir loops
let registrationAttempts = 0;

// ✅ Función de limpieza centralizada
function cleanupRegistrationState() {
  isRegistering = false;
}

// ✅ PWA registration con protección total contra crashes
export function registerPWA(): Promise<ServiceWorkerRegistration | null> {
  const now = Date.now();
  
  // ✅ Protección contra múltiples llamadas simultáneas
  if (isRegistering) {
    console.log('🔄 Service Worker registration already in progress');
    return registrationPromise || Promise.resolve(null);
  }
  
  // ✅ Si ya hay una promesa de registro, retornarla
  if (registrationPromise) {
    console.log('🔄 Service Worker already registered or registration in progress');
    return registrationPromise;
  }
  
  // ✅ Debouncing: prevenir registros muy frecuentes
  if (now - lastRegistrationAttempt < REGISTRATION_DEBOUNCE_MS) {
    console.log('⏱️ Registration debounced, too soon since last attempt');
    return Promise.resolve(null);
  }
  
  // ✅ Límite de intentos para prevenir loops infinitos
  if (registrationAttempts >= MAX_REGISTRATION_ATTEMPTS) {
    console.error('❌ Maximum registration attempts reached, aborting');
    return Promise.resolve(null);
  }
  
  // ✅ Verificaciones de soporte y entorno
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker not supported');
    return Promise.resolve(null);
  }
  
  if (!import.meta.env.PROD) {
    console.log('⚠️ Service Worker registration skipped in development mode');
    return Promise.resolve(null);
  }
  
  // ✅ Actualizar estado de control
  isRegistering = true;
  lastRegistrationAttempt = now;
  registrationAttempts++;
  
  console.log(`🔄 Starting Service Worker registration (attempt ${registrationAttempts}/${MAX_REGISTRATION_ATTEMPTS})`);
  
  // ✅ Promise con timeout y manejo de errores robusto
  registrationPromise = new Promise<ServiceWorkerRegistration | null>((resolve) => {
    // ✅ Timeout para prevenir bloqueos infinitos
    const timeoutId = setTimeout(() => {
      console.error('❌ Service Worker registration timeout');
      cleanupRegistrationState();
      registrationPromise = null;
      resolve(null); // Resolver con null en lugar de reject para evitar crashes
    }, 8000); // 8 segundos timeout
    
    const registerSW = async () => {
      try {
        // ✅ Intentar registro con manejo de errores específico
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'all'
        });
        
        console.log('✅ Service Worker registered successfully:', registration);
        
        clearTimeout(timeoutId);
        cleanupRegistrationState();
        resolve(registration);
        
      } catch (registrationError) {
        console.error('❌ Service Worker registration failed:', registrationError);
        clearTimeout(timeoutId);
        cleanupRegistrationState();
        registrationPromise = null;
        
        // ✅ NO hacer retry automático para evitar loops
        resolve(null); // Resolver con null en lugar de reject
      }
    };
    
    // ✅ Registrar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerSW, { once: true });
    } else {
      registerSW();
    }
  });
  
  return registrationPromise;
}

// ✅ PWA detection simplificado y seguro
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

    return isPWA;
  } catch (error) {
    console.error('❌ PWA detection failed:', error);
    return false;
  }
}

// ✅ Safe PWA launch method detection
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

// ✅ Safe localStorage operations
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

// ✅ Install prompt utilities con manejo de errores
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

// ✅ Install prompt listener con cleanup
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

// ✅ Cleanup function
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