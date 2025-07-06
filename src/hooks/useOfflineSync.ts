import { useCallback, useEffect, useState } from 'react'
import { BACKEND_URL } from '../config'
import { db } from '../lib/offline/db'
import { ConflictResolver } from '../lib/offline/conflictResolver'
import { useAuth } from './useAuth'
import type { Order, Product, SyncQueueItem } from '../types'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const { user } = useAuth()

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Conexión restaurada. Sincronizando...')
      syncPendingChanges()
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📴 Sin conexión. Los cambios se guardarán localmente.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Actualizar contador de items pendientes
  const updatePendingCount = useCallback(async () => {
    const count = await db.syncQueue.count()
    setPendingCount(count)
  }, [])

  useEffect(() => {
    updatePendingCount()
    // Actualizar cada 30 segundos
    const interval = setInterval(updatePendingCount, 30000)
    return () => clearInterval(interval)
  }, [updatePendingCount])

  // Sincronizar cambios pendientes
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || syncStatus === 'syncing' || !user) return

    setSyncStatus('syncing')
    
    try {
      // Obtener items pendientes de sincronizar
      const pendingItems = await db.getPendingSyncItems()
      
      for (const item of pendingItems) {
        try {
          switch (item.entityType) {
            case 'order':
              await syncOrder(item)
              break
            case 'product':
              await syncProduct(item)
              break
          }
          
          // Eliminar de la cola si se sincronizó correctamente
          await db.markAsSynced(item.entityType, item.entityId)
        } catch (error) {
          console.error('❌ Error sincronizando item:', item, error)
          // Incrementar reintentos
          await db.incrementRetries(item.id!, error instanceof Error ? error.message : 'Unknown error')
        }
      }

      setSyncStatus('idle')
      await updatePendingCount()
      console.log('✅ Sincronización completada')
    } catch (error) {
      setSyncStatus('error')
      console.error('❌ Error al sincronizar:', error)
    }
  }, [isOnline, syncStatus, user, updatePendingCount])

  // Trigger background sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      // Trigger background sync if available
      navigator.serviceWorker.ready.then((registration) => {
        if ('sync' in registration) {
          (registration as any).sync.register('background-sync')
            .then(() => console.log('🔄 Background sync triggered on reconnection'))
            .catch((error: Error) => console.log('❌ Background sync failed:', error))
        }
      })
    }
  }, [isOnline, pendingCount])

  // Sincronizar un pedido específico
  const syncOrder = async (item: SyncQueueItem) => {
    let localOrder = await db.orders.get(item.entityId)
    if (!localOrder) return

    try {
      // Para updates, primero obtener la versión del servidor
      let serverOrder: Order | null = null
      if (item.action === 'update' && localOrder.id) {
        try {
          const getResponse = await fetch(`${BACKEND_URL}/api/orders/${localOrder.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (getResponse.ok) {
            serverOrder = await getResponse.json()
          }
        } catch (error) {
          console.log('⚠️ No se pudo obtener versión del servidor, continuando...')
        }
      }

      // Detectar y resolver conflictos si es necesario
      if (serverOrder && ConflictResolver.detectConflict(localOrder, serverOrder)) {
        console.log('⚠️ Conflicto detectado, resolviendo...')
        const resolution = ConflictResolver.resolveLastWriteWins(localOrder, serverOrder, 'order')
        
        if (resolution.winner === 'server') {
          // El servidor gana, actualizar local
          await db.orders.update(localOrder.id!, {
            ...resolution.resolvedData,
            syncStatus: 'synced'
          })
          console.log('✅ Conflicto resuelto: servidor gana')
          return
        } else if (resolution.winner === 'local') {
          // El local gana, usar datos locales para el envío
          localOrder = resolution.resolvedData as Order
        }
      }

      // Enviar datos al servidor
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: item.action === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...localOrder,
          client_generated_id: localOrder.clientGeneratedId,
          modified_by: user?.id,
          version: localOrder.version || 0,
          last_modified_at: localOrder.lastModifiedAt || localOrder.updatedAt
        })
      })

      if (!response.ok) {
        if (response.status === 409) {
          // Conflicto en el servidor, manejar
          console.log('⚠️ Conflicto en servidor (409), reintentando...')
          throw new Error('CONFLICT')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Actualizar el ID local con el ID del servidor
      if (data && localOrder.id !== data.id) {
        await db.orders.update(localOrder.id!, {
          id: data.id,
          syncStatus: 'synced',
          version: data.version || localOrder.version || 0,
          lastModifiedAt: data.last_modified_at || new Date().toISOString()
        })
      } else if (data) {
        // Actualizar versión y timestamp
        await db.orders.update(localOrder.id!, {
          syncStatus: 'synced',
          version: data.version || localOrder.version || 0,
          lastModifiedAt: data.last_modified_at || new Date().toISOString()
        })
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFLICT') {
        // Reintentar con resolución de conflicto
        console.log('🔄 Reintentando con resolución de conflicto...')
        throw error
      }
      throw error
    }
  }

  // Sincronizar un producto específico
  const syncProduct = async (item: SyncQueueItem) => {
    let localProduct = await db.products.get(item.entityId)
    if (!localProduct) return

    try {
      // Para updates, primero obtener la versión del servidor
      let serverProduct: Product | null = null
      if (item.action === 'update' && localProduct.id) {
        try {
          const getResponse = await fetch(`${BACKEND_URL}/api/products/${localProduct.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (getResponse.ok) {
            serverProduct = await getResponse.json()
          }
        } catch (error) {
          console.log('⚠️ No se pudo obtener versión del servidor, continuando...')
        }
      }

      // Detectar y resolver conflictos si es necesario
      if (serverProduct && ConflictResolver.detectConflict(localProduct, serverProduct)) {
        console.log('⚠️ Conflicto detectado, resolviendo...')
        const resolution = ConflictResolver.resolveLastWriteWins(localProduct, serverProduct, 'product')
        
        if (resolution.winner === 'server') {
          // El servidor gana, actualizar local
          await db.products.update(localProduct.id!, {
            ...resolution.resolvedData,
            syncStatus: 'synced'
          })
          console.log('✅ Conflicto resuelto: servidor gana')
          return
        } else if (resolution.winner === 'local') {
          // El local gana, usar datos locales para el envío
          localProduct = resolution.resolvedData as Product
        }
      }

      // Enviar datos al servidor
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: item.action === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...localProduct,
          modified_by: user?.id,
          version: localProduct.version || 0,
          last_modified_at: localProduct.lastModifiedAt || localProduct.updatedAt
        })
      })

      if (!response.ok) {
        if (response.status === 409) {
          // Conflicto en el servidor, manejar
          console.log('⚠️ Conflicto en servidor (409), reintentando...')
          throw new Error('CONFLICT')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Actualizar el ID local con el ID del servidor
      if (data && localProduct.id !== data.id) {
        await db.products.update(localProduct.id!, {
          id: data.id,
          syncStatus: 'synced',
          version: data.version || localProduct.version || 0,
          lastModifiedAt: data.last_modified_at || new Date().toISOString()
        })
      } else if (data) {
        // Actualizar versión y timestamp
        await db.products.update(localProduct.id!, {
          syncStatus: 'synced',
          version: data.version || localProduct.version || 0,
          lastModifiedAt: data.last_modified_at || new Date().toISOString()
      })
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFLICT') {
        // Reintentar con resolución de conflicto
        console.log('🔄 Reintentando con resolución de conflicto...')
        throw error
      }
      throw error
    }
  }

  // Verificar espacio de almacenamiento
  useEffect(() => {
    const checkStorage = async () => {
      const daysRemaining = await db.checkDataExpiration()
      
      if (daysRemaining <= 5) {
        console.warn(`⚠️ Atención: Los pedidos offline de más de 30 días se eliminarán en ${daysRemaining} días`)
      }
    }

    checkStorage()
    // Verificar cada día
    const interval = setInterval(checkStorage, 24 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    isOnline,
    syncStatus,
    syncPendingChanges,
    pendingCount,
    updatePendingCount
  }
} 