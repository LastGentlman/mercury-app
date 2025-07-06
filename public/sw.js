// Service Worker for Mercury App with Background Sync
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
  );
});

// Background Sync registration
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic background sync triggered:', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data with server
async function syncOfflineData() {
  try {
    console.log('🔄 Starting background sync...');
    
    // Get all clients to show sync status
    const clients = await self.clients.matchAll();
    
    // Notify clients that sync is starting
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: new Date().toISOString()
      });
    });

    // Get pending sync items from IndexedDB
    const pendingItems = await getPendingSyncItems();
    
    if (pendingItems.length === 0) {
      console.log('✅ No pending items to sync');
      return;
    }

    console.log(`🔄 Syncing ${pendingItems.length} items...`);

    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      console.log('❌ No auth token available for sync');
      return;
    }

    // Sync each item
    for (const item of pendingItems) {
      try {
        await syncItem(item, token);
        await markItemAsSynced(item);
        console.log(`✅ Synced item: ${item.entityType} ${item.entityId}`);
      } catch (error) {
        console.error(`❌ Failed to sync item ${item.entityId}:`, error);
        await incrementRetries(item);
      }
    }

    // Notify clients that sync completed
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString(),
        itemsCount: pendingItems.length
      });
    });

    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    
    // Notify clients of sync error
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

// Get pending sync items from IndexedDB
async function getPendingSyncItems() {
  return new Promise((resolve) => {
    const request = indexedDB.open('PedidoListDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const query = store.index('retries').getAll(IDBKeyRange.upperBound(2)); // Max 3 retries
      
      query.onsuccess = () => {
        resolve(query.result || []);
      };
      
      query.onerror = () => {
        console.error('❌ Error getting pending items');
        resolve([]);
      };
    };
    
    request.onerror = () => {
      console.error('❌ Error opening IndexedDB');
      resolve([]);
    };
  });
}

// Get auth token from localStorage (via client)
async function getAuthToken() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    try {
      const response = await client.postMessage({
        type: 'GET_AUTH_TOKEN'
      });
      if (response && response.token) {
        return response.token;
      }
    } catch (error) {
      console.log('Could not get token from client:', error);
    }
  }
  return null;
}

// Sync a single item
async function syncItem(item, token) {
  const BACKEND_URL = 'http://localhost:3001'; // Should be configurable
  
  // Get item data from IndexedDB
  const itemData = await getItemData(item);
  if (!itemData) {
    throw new Error('Item data not found');
  }

  const url = `${BACKEND_URL}/api/${item.entityType}s`;
  const method = item.action === 'create' ? 'POST' : 'PUT';
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Get item data from IndexedDB
async function getItemData(item) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PedidoListDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([item.entityType + 's'], 'readonly');
      const store = transaction.objectStore(item.entityType + 's');
      const query = store.get(parseInt(item.entityId));
      
      query.onsuccess = () => {
        resolve(query.result);
      };
      
      query.onerror = () => {
        console.error('❌ Error getting item data');
        resolve(null);
      };
    };
    
    request.onerror = () => {
      console.error('❌ Error opening IndexedDB');
      resolve(null);
    };
  });
}

// Mark item as synced
async function markItemAsSynced(item) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PedidoListDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const query = store.index('entityType,entityId').getAll([item.entityType, item.entityId]);
      
      query.onsuccess = () => {
        const items = query.result;
        items.forEach(syncItem => {
          store.delete(syncItem.id);
        });
        resolve();
      };
      
      query.onerror = () => {
        console.error('❌ Error marking item as synced');
        resolve();
      };
    };
    
    request.onerror = () => {
      console.error('❌ Error opening IndexedDB');
      resolve();
    };
  });
}

// Increment retry count
async function incrementRetries(item) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PedidoListDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const query = store.index('entityType,entityId').getAll([item.entityType, item.entityId]);
      
      query.onsuccess = () => {
        const items = query.result;
        items.forEach(syncItem => {
          store.put({
            ...syncItem,
            retries: (syncItem.retries || 0) + 1
          });
        });
        resolve();
      };
      
      query.onerror = () => {
        console.error('❌ Error incrementing retries');
        resolve();
      };
    };
    
    request.onerror = () => {
      console.error('❌ Error opening IndexedDB');
      resolve();
    };
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('📨 Message from client:', event.data);
  
  if (event.data.type === 'GET_AUTH_TOKEN') {
    // This would need to be handled by the client
    // The service worker can't directly access localStorage
    event.ports[0].postMessage({ token: null });
  }
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (API calls)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse && fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page if available
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
}); 