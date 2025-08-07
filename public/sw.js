// public/sw.js - OPTIMIZED VERSION WITH AUTH PERFORMANCE IMPROVEMENTS
const CACHE_NAME = 'mercury-app-v1';
const OFFLINE_CACHE = 'mercury-offline-v1';

// ✅ Assets estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// ✅ URLs que deben ir directo a la red (optimized for auth)
const NETWORK_ONLY_URLS = [
  '/api/auth/',
  '/api/login',
  '/api/logout',
  '/auth/callback'  // Added auth callback for faster processing
];

// ✅ Auth-specific cache strategy configuration
const AUTH_CACHE_STRATEGY = {
  networkFirst: true,
  timeout: 3000,        // Reduced from 30s to 3s for auth operations
  fallbackToCache: false,
  maxAge: 60000        // 1 minute max age for auth-related responses
};

// ✅ Evento INSTALL - Cache de assets estáticos
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  
  event.waitUntil(
    Promise.resolve()
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker install failed:', error);
        // No re-throw para evitar crash
      })
  );
});

// ✅ Evento ACTIVATE - Limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.resolve()
      .then(() => caches.keys())
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated successfully');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker activation failed:', error);
        // No re-throw para evitar crash
      })
  );
});

// ✅ Background Sync - OPTIMIZED with reduced timeout
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// ✅ OPTIMIZED sincronización offline con timeout reducido
async function syncOfflineData() {
  try {
    console.log('🔄 Starting optimized background sync...');
    
    // ✅ Reduced timeout from 30s to 8s for better performance
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sync timeout after 8 seconds')), 8000);
    });
    
    // ✅ Obtener token de autenticación de forma segura
    const authTokenPromise = getAuthTokenSafely();
    
    // ✅ Race entre sync y timeout
    const authToken = await Promise.race([authTokenPromise, timeoutPromise]);
    
    if (!authToken) {
      console.log('⚠️ No auth token available, skipping sync');
      return;
    }
    
    // ✅ Realizar sincronización real con timeout optimizado
    const syncPromise = performDataSync(authToken);
    const result = await Promise.race([syncPromise, timeoutPromise]);
    
    console.log('✅ Background sync completed successfully:', result);
    
    // ✅ Notificar al cliente sobre el éxito
    notifyClients({
      type: 'SYNC_SUCCESS',
      data: result
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    
    // ✅ Simplified error notification for better performance
    await self.registration.showNotification('Sync Failed', {
      body: 'Some data could not be synchronized. Will retry automatically.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sync-failed',
      actions: [
        {
          action: 'retry',
          title: 'Retry Now'
        }
      ]
    });
    
    // ✅ Notificar al cliente sobre el error
    notifyClients({
      type: 'SYNC_ERROR',
      error: error.message
    });
    
    // ✅ NO re-throw para evitar crash
    return { error: error.message };
  }
}

// ✅ OPTIMIZED función segura para obtener token de auth
async function getAuthTokenSafely() {
  try {
    // ✅ Obtener clientes activos
    const clients = await self.clients.matchAll({ 
      includeUncontrolled: true,
      type: 'window'
    });
    
    if (clients.length === 0) {
      console.log('⚠️ No active clients found');
      return null;
    }
    
    // ✅ Reduced timeout from 5s to 2s for auth token requests
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Auth token request timeout'));
      }, 2000); // Reduced timeout for faster auth operations
      
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data.token);
      };
      
      // ✅ Enviar petición al primer cliente
      clients[0].postMessage(
        { type: 'GET_AUTH_TOKEN' },
        [messageChannel.port2]
      );
    });
    
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    return null;
  }
}

// ✅ OPTIMIZED implementación real de sincronización
async function performDataSync(authToken) {
  try {
    // ✅ Configuración optimizada de la petición
    const syncResponse = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lastSync: Date.now(),
        source: 'service-worker'
      })
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Sync failed with status: ${syncResponse.status}`);
    }
    
    const syncData = await syncResponse.json();
    
    return {
      itemsCount: syncData.itemsCount || 0,
      lastSync: Date.now(),
      status: 'success'
    };
    
  } catch (error) {
    console.error('❌ Data sync request failed:', error);
    throw error;
  }
}

// ✅ Función para notificar a todos los clientes
async function notifyClients(message) {
  try {
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    clients.forEach(client => {
      try {
        client.postMessage(message);
      } catch (error) {
        console.error('❌ Failed to notify client:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get clients for notification:', error);
  }
}

// ✅ Periodic Background Sync (si está soportado)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic background sync triggered:', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// ✅ Manejo de mensajes del cliente - IMPLEMENTACIÓN COMPLETA
self.addEventListener('message', (event) => {
  try {
    console.log('📨 Message from client:', event.data);
    
    const { type, _data } = event.data || {};
    
    switch (type) {
      case 'GET_AUTH_TOKEN':
        // ✅ Este mensaje se maneja en la función getAuthTokenSafely
        if (event.ports && event.ports[0]) {
          // El SW no tiene acceso directo a localStorage
          // Responder que no tiene el token
          event.ports[0].postMessage({ token: null });
        }
        break;
        
      case 'SKIP_WAITING':
        // ✅ Forzar activación del nuevo SW
        self.skipWaiting();
        break;
        
      case 'CHECK_UPDATE':
        // ✅ Verificar actualizaciones
        checkForUpdates();
        break;
        
      default:
        console.log('⚠️ Unknown message type:', type);
    }
    
  } catch (error) {
    console.error('❌ Message handler error:', error);
    // ✅ No re-throw para evitar crash
  }
});

// ✅ Función para verificar actualizaciones
async function checkForUpdates() {
  try {
    const registration = await self.registration.update();
    console.log('✅ Update check completed');
    return registration;
  } catch (error) {
    console.error('❌ Update check failed:', error);
    return null;
  }
}

// ✅ AUTH-OPTIMIZED fetch strategy
function isAuthRelatedRequest(url) {
  return url.pathname.includes('/auth') || 
         url.pathname.includes('/api/auth') ||
         url.pathname.includes('/login') ||
         url.pathname.includes('/logout');
}

// ✅ Evento FETCH - OPTIMIZED estrategia de caching inteligente
self.addEventListener('fetch', (event) => {
  try {
    const url = new URL(event.request.url);
    
    // ✅ Auth-specific optimization: bypass cache for auth operations
    if (isAuthRelatedRequest(url)) {
      console.log('🔐 Auth request detected, using network-only strategy');
      event.respondWith(networkOnlyAuth(event.request));
      return;
    }
    
    // ✅ Verificar si es una URL que debe ir directo a la red
    const isNetworkOnly = NETWORK_ONLY_URLS.some(networkUrl => 
      url.pathname.includes(networkUrl)
    );
    
    if (isNetworkOnly) {
      // ✅ Network only para APIs específicas
      event.respondWith(fetch(event.request));
      return;
    }
    
    // ✅ Cache First para assets estáticos
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname.includes('.')) {
      event.respondWith(cacheFirst(event.request));
      return;
    }
    
    // ✅ Network First para páginas y APIs
    event.respondWith(networkFirst(event.request));
    
  } catch (error) {
    console.error('❌ Fetch handler error:', error);
    // ✅ Fallback seguro
    event.respondWith(fetch(event.request));
  }
});

// ✅ NEW: Network-only strategy optimized for auth
async function networkOnlyAuth(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_CACHE_STRATEGY.timeout);
    
    const response = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Don't cache auth responses for security
    return response;
    
  } catch (error) {
    console.error('❌ Auth network request failed:', error);
    
    if (error.name === 'AbortError') {
      return new Response('Authentication timeout', { 
        status: 408,
        statusText: 'Request Timeout'
      });
    }
    
    return new Response('Authentication failed', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ✅ Estrategia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// ✅ OPTIMIZED estrategia Network First
async function networkFirst(request) {
  try {
    // Add timeout for network requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // ✅ Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Network request failed, trying cache:', error);
    
    // ✅ Fallback a cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // ✅ Fallback final
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Service Unavailable', { status: 503 });
  }
}

// ✅ Manejo de notificaciones (si se usan)
self.addEventListener('notificationclick', (event) => {
  try {
    console.log('🔔 Notification clicked:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'retry') {
      // ✅ Retry sync on notification action
      event.waitUntil(syncOfflineData());
    }
    
    // ✅ Abrir o enfocar la app
    event.waitUntil(
      self.clients.openWindow('/')
    );
    
  } catch (error) {
    console.error('❌ Notification click handler error:', error);
  }
});

// ✅ Log de inicio del service worker
console.log('🚀 Service Worker script loaded successfully - AUTH OPTIMIZED'); 