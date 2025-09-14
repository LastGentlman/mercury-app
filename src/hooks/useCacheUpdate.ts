import { useEffect, useState, useCallback } from 'react'

interface CacheUpdateState {
  hasUpdate: boolean
  isUpdating: boolean
  lastUpdate: Date | null
}

export function useCacheUpdate() {
  const [state, setState] = useState<CacheUpdateState>({
    hasUpdate: false,
    isUpdating: false,
    lastUpdate: null
  })

  // ✅ Función para forzar actualización de cache
  const forceUpdate = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isUpdating: true }))
      
      // ✅ Limpiar cache del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        )
        console.log('🧹 Browser caches cleared')
      }
      
      // ✅ Limpiar localStorage de versiones antiguas
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('v1') || key.includes('v2'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // ✅ Enviar mensaje al service worker para limpiar cache
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE'
        })
      }
      
      // ✅ Recargar la página
      window.location.reload()
      
    } catch (error) {
      console.error('❌ Failed to force update:', error)
      setState(prev => ({ ...prev, isUpdating: false }))
    }
  }, [])

  // ✅ Función para verificar actualizaciones
  const checkForUpdates = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          console.log('✅ Update check completed')
        }
      }
    } catch (error) {
      console.error('❌ Update check failed:', error)
    }
  }, [])

  // ✅ Función para mostrar notificación de actualización
  const showUpdateNotification = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      hasUpdate: true,
      lastUpdate: new Date()
    }))
  }, [])

  // ✅ Listener para mensajes del service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { type } = event.data || {}
        
        switch (type) {
          case 'RELOAD_PAGE':
            console.log('🔄 Service worker requested page reload')
            window.location.reload()
            break
            
          case 'UPDATE_AVAILABLE':
            showUpdateNotification()
            break
        }
      }
      
      navigator.serviceWorker.addEventListener('message', handleMessage)
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [showUpdateNotification])

  // ✅ Verificar actualizaciones periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates()
    }, 60000) // Cada minuto
    
    return () => clearInterval(interval)
  }, [checkForUpdates])

  return {
    ...state,
    forceUpdate,
    checkForUpdates,
    showUpdateNotification
  }
}
