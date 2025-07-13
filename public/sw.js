// public/sw.js - FIXED VERSION (Crash-Free)
const CACHE_NAME = 'mercury-app-v1';
const OFFLINE_CACHE = 'mercury-offline-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys()
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
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker activation failed:', error);
      })
  );
});

// Background Sync registration - FIXED WITH PROPER ERROR HANDLING
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// FIXED: Complete syncOfflineData function
async function syncOfflineData() {
  try {
    console.log('🔄 Starting background sync...');
    
    // Notify client that sync started
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: new Date().toISOString()
      });
    });

    // Get auth token from client (if available)
    const authToken = await getAuthToken();
    
    if (!authToken) {
      console.log('⚠️ No auth token available, skipping sync');
      return;
    }

    // Simulate actual sync work
    const result = await performDataSync(authToken);
    
    // Notify clients of successful sync
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString(),
        itemsCount: result.itemsCount || 0
      });
    });

    console.log('✅ Background sync completed');
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    
    // Notify clients of sync failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    });
  }
}

// FIXED: Proper auth token retrieval
function getAuthToken() {
  return new Promise((resolve) => {
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('⚠️ Auth token request timed out');
      resolve(null);
    }, 5000);

    self.clients.matchAll().then(clients => {
      if (clients.length === 0) {
        clearTimeout(timeout);
        resolve(null);
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data.token);
      };

      clients[0].postMessage(
        { type: 'GET_AUTH_TOKEN' },
        [messageChannel.port2]
      );
    });
  });
}

// FIXED: Actual sync implementation with proper error handling
async function performDataSync(authToken) {
  try {
    // Example sync logic - replace with your actual API calls
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lastSync: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const data = await response.json();
    return { itemsCount: data.itemsCount || 0 };
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    throw error;
  }
}

// Periodic Background Sync (if supported) - FIXED
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic background sync triggered:', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// FIXED: Handle messages from clients with proper error handling
self.addEventListener('message', (event) => {
  try {
    console.log('📨 Message from client:', event.data);
    
    if (event.data.type === 'GET_AUTH_TOKEN') {
      // This message is handled by the client-side code
      // The service worker doesn't have direct access to localStorage
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ token: null });
      }
    }
  } catch (error) {
    console.error('❌ Message handler error:', error);
  }
});

// FIXED: Fetch event with proper error handling and caching strategy
self.addEventListener('fetch', (event) => {
  try {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
      return;
    }

    // Skip external requests (API calls)
    if (!event.request.url.startsWith(self.location.origin)) {
      return;
    }

    // Skip if URL contains 'api' (API endpoints)
    if (event.request.url.includes('/api/')) {
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }

          // Fetch from network
          return fetch(event.request)
            .then((fetchResponse) => {
              // Cache successful responses
              if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  })
                  .catch((error) => {
                    console.error('❌ Cache put failed:', error);
                  });
              }
              return fetchResponse;
            })
            .catch((error) => {
              console.error('❌ Fetch failed:', error);
              // Return offline page if available for navigation requests
              if (event.request.destination === 'document') {
                return caches.match('/') || new Response('Offline', { status: 503 });
              }
              throw error;
            });
        })
        .catch((error) => {
          console.error('❌ Cache match failed:', error);
          return new Response('Error', { status: 500 });
        })
    );
  } catch (error) {
    console.error('❌ Fetch event handler error:', error);
  }
}); 