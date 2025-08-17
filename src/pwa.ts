// src/pwa.ts - ENHANCED VERSION (Debounced & Race-Condition Safe)

// Define BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ✅ MEJORADO: Variables de control para debouncing y race conditions
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let isRegistering = false;

let lastRegistrationAttempt = 0;
const REGISTRATION_DEBOUNCE_MS = 1000; // 1 segundo de debounce
const MAX_REGISTRATION_ATTEMPTS = 3;
let registrationAttempts = 0;

// ✅ MEJORADO: PWA registration con debouncing y protección robusta
export function registerPWA(): Promise<ServiceWorkerRegistration | null> {
  const now = Date.now();
  
  // ✅ Protección contra múltiples llamadas simultáneas
  if (isRegistering) {
    console.log('🔄 Service Worker registration already in progress, returning existing promise');
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
  
  // ✅ MEJORADO: Promise con timeout y mejor manejo de errores
  registrationPromise = new Promise<ServiceWorkerRegistration | null>((resolve, reject) => {
    // ✅ Timeout para prevenir bloqueos infinitos
    const timeoutId = setTimeout(() => {
      console.error('❌ Service Worker registration timeout');
      cleanupRegistrationState();
      reject(new Error('Service Worker registration timeout'));
    }, 10000); // 10 segundos timeout
    
    const registerSW = async () => {
      try {

        
        // ✅ Intentar registro con retry automático
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'all'
        });
        
        console.log('✅ Service Worker registered successfully:', registration);
        
        // ✅ Configurar funcionalidades adicionales
        await setupServiceWorkerFeatures(registration);
        
        clearTimeout(timeoutId);
        cleanupRegistrationState();
        resolve(registration);
        
      } catch (registrationError) {
        console.error('❌ Service Worker registration failed:', registrationError);
        clearTimeout(timeoutId);
        cleanupRegistrationState();
        
        // ✅ Reintento automático para errores específicos
        if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS && 
            registrationError instanceof Error && 
            registrationError.message.includes('network')) {
          console.log('🔄 Retrying registration due to network error...');
          setTimeout(() => {
            registrationPromise = null;
            registerPWA().then(resolve).catch(reject);
          }, 2000); // Esperar 2 segundos antes del retry
        } else {
          reject(registrationError);
        }
      }
    };
    
    // ✅ Registrar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      globalThis.addEventListener('load', registerSW, { once: true });
    } else {
      registerSW();
    }
  });
  
  return registrationPromise;
}

// ✅ MEJORADO: Función de limpieza centralizada
function cleanupRegistrationState() {
  isRegistering = false;
}

// ✅ MEJORADO: Configuración de funcionalidades del Service Worker
async function setupServiceWorkerFeatures(registration: ServiceWorkerRegistration) {
  try {
    // ✅ Configurar manejador de actualizaciones
    setupUpdateHandler(registration);
    
    // ✅ Registrar Background Sync
    await registerBackgroundSync(registration);
    
    // ✅ Registrar Periodic Background Sync
    await registerPeriodicBackgroundSync(registration);
    
    console.log('✅ Service Worker features configured successfully');
  } catch (error) {
    console.error('❌ Service Worker features setup failed:', error);
    // ✅ No fallar el registro principal por errores en features
  }
}

// ✅ MEJORADO: Setup update handler con mejor cleanup
function setupUpdateHandler(registration: ServiceWorkerRegistration): (() => void) | void {
  try {
    const updateHandler = () => {
      const newWorker = registration.installing;
      if (newWorker) {
        const stateChangeHandler = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // ✅ Mostrar prompt de actualización de forma no bloqueante
            showUpdateNotification();
          }
          
          // ✅ Cleanup automático del listener
          if (newWorker.state === 'activated' || newWorker.state === 'redundant') {
            newWorker.removeEventListener('statechange', stateChangeHandler);
          }
        };

        newWorker.addEventListener('statechange', stateChangeHandler);
      }
    };

    registration.addEventListener('updatefound', updateHandler);
    
    // ✅ Cleanup cuando sea necesario
    const cleanup = () => {
      registration.removeEventListener('updatefound', updateHandler);
    };
    return cleanup;
  } catch (error) {
    console.error('❌ Update handler setup failed:', error);
  }
}

// ✅ MEJORADO: Notificación de actualización no bloqueante
function showUpdateNotification() {
  try {
    // ✅ Usar una notificación más elegante en lugar de confirm()
    const updateNotification = document.createElement('div');
    updateNotification.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px; border-radius: 5px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <strong>🔄 Nueva versión disponible</strong><br>
        <button onclick="window.location.reload()" style="background: white; color: #4CAF50; border: none; padding: 5px 10px; border-radius: 3px; margin-top: 5px; cursor: pointer;">Actualizar</button>
        <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 3px; margin-top: 5px; margin-left: 5px; cursor: pointer;">Más tarde</button>
      </div>
    `;
    document.body.appendChild(updateNotification);
    
    // ✅ Auto-remover después de 30 segundos
    setTimeout(() => {
      if (updateNotification.parentElement) {
        updateNotification.remove();
      }
    }, 30000);
  } catch (error) {
    console.error('❌ Update notification failed:', error);
    // ✅ Fallback a confirm() si falla la notificación elegante
    if (confirm('Nueva versión disponible! ¿Recargar para actualizar?')) {
      globalThis.location.reload();
    }
  }
}

// Enhanced PWA detection with safety checks
export function isPWAInstalled(): boolean {
  try {
    // Method 1: Check display-mode (most reliable)
    const isStandalone = globalThis.matchMedia('(display-mode: standalone)').matches;

    // Method 2: iOS Safari specific
    const isIOSStandalone = (globalThis.navigator as { standalone?: boolean }).standalone === true;

    // Method 3: Check URL parameters
    const searchParams = new URLSearchParams(globalThis.location.search);
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
        displayMode: globalThis.matchMedia('(display-mode: standalone)').media
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
    
    if (globalThis.matchMedia('(display-mode: browser)').matches) {
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
      await (registration as { sync?: { register: (name: string) => Promise<void> } }).sync!.register('background-sync');
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
        await (registration as { periodicSync?: { register: (name: string, options: { minInterval: number }) => Promise<void> } }).periodicSync!.register('periodic-sync', {
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
      const installPrompt = (globalThis as { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt;
      
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice
          .then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('✅ User accepted the install prompt');
              markAsInstalledPWA();
              resolve(true);
            } else {
              console.log('⚠️ User dismissed the install prompt');
              resolve(false);
            }
            // Clean up
            (globalThis as { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt = null;
          })
          .catch((error: Error) => {
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
      globalThis.removeEventListener('beforeinstallprompt', beforeInstallPromptListener);
    }
    if (appInstalledListener) {
      globalThis.removeEventListener('appinstalled', appInstalledListener);
    }

    // Create new listeners
    beforeInstallPromptListener = (e: Event) => {
      e.preventDefault();
      (globalThis as { deferredPrompt?: Event }).deferredPrompt = e;
    };

    appInstalledListener = () => {
      console.log('📱 PWA was installed');
      markAsInstalledPWA();
      (globalThis as { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt = null;
    };

    // Add listeners
    globalThis.addEventListener('beforeinstallprompt', beforeInstallPromptListener);
    globalThis.addEventListener('appinstalled', appInstalledListener);
    
  } catch (error) {
    console.error('❌ Install prompt listener setup failed:', error);
  }
}

// Cleanup function for when component unmounts
export function cleanupPWAListeners() {
  try {
    if (beforeInstallPromptListener) {
      globalThis.removeEventListener('beforeinstallprompt', beforeInstallPromptListener);
      beforeInstallPromptListener = null;
    }
    if (appInstalledListener) {
      globalThis.removeEventListener('appinstalled', appInstalledListener);
      appInstalledListener = null;
    }
  } catch (error) {
    console.error('❌ PWA listeners cleanup failed:', error);
  }
} 