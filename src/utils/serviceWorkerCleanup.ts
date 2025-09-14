/**
 * Service Worker Cleanup Utilities
 * 
 * Provides functions to clean up Service Worker and PWA-related data
 * after account deletion or logout
 */

/**
 * Clean up Service Worker and PWA-related data
 */
export async function cleanupServiceWorker(): Promise<void> {
  console.log('🧹 Starting Service Worker cleanup...')
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      
      for (const registration of registrations) {
        console.log('🗑️ Unregistering service worker:', registration.scope)
        
        // Force unregister and wait for completion
        const unregisterPromise = registration.unregister()
        
        // Also try to stop the worker if possible
        if (registration.active) {
          registration.active.postMessage({ type: 'SKIP_WAITING' })
        }
        
        await unregisterPromise
      }
      
      console.log('✅ All service workers unregistered')
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      
      for (const cacheName of cacheNames) {
        console.log('🗑️ Deleting cache:', cacheName)
        await caches.delete(cacheName)
      }
      
      console.log('✅ All caches cleared')
    }
    
    // Clear IndexedDB if it exists
    if ('indexedDB' in window) {
      try {
        // Try to clear any IndexedDB databases
        const databases = await indexedDB.databases?.() || []
        
        for (const db of databases) {
          if (db.name) {
            console.log('🗑️ Clearing IndexedDB:', db.name)
            const deleteReq = indexedDB.deleteDatabase(db.name)
            await new Promise((resolve, reject) => {
              deleteReq.onsuccess = () => resolve(undefined)
              deleteReq.onerror = () => reject(deleteReq.error)
            })
          }
        }
        
        console.log('✅ IndexedDB cleared')
      } catch (error) {
        console.warn('⚠️ Error clearing IndexedDB:', error)
      }
    }
    
    // Clear localStorage and sessionStorage (already done elsewhere, but ensure it's clean)
    localStorage.clear()
    sessionStorage.clear()
    
    console.log('✅ Service Worker cleanup completed')
    
  } catch (error) {
    console.error('❌ Error during Service Worker cleanup:', error)
    // Don't throw - cleanup should be best effort
  }
}

/**
 * Force reload the page to ensure clean state
 */
export function forcePageReload(): void {
  console.log('🔄 Forcing page reload for clean state...')
  
  // Use replace to avoid adding to history
  window.location.replace('/auth')
}

/**
 * Complete cleanup after account deletion
 */
export async function performCompleteCleanup(): Promise<void> {
  console.log('🧹 Starting complete cleanup after account deletion...')
  
  // Clean up Service Worker and PWA data
  await cleanupServiceWorker()
  
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  })
  
  // Clear any global state
  if (typeof window !== 'undefined') {
    const globalWindow = window as any
    globalWindow.__AUTH_STATE__ = null
    globalWindow.__USER_DATA__ = null
    globalWindow.__REACT_QUERY_STATE__ = null
  }
  
  console.log('✅ Complete cleanup finished')
  
  // Force reload after a short delay
  setTimeout(() => {
    forcePageReload()
  }, 100)
}
