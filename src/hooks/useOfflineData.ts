import { useCallback } from 'react'
import { db } from '../lib/offline/db.ts'
import type { Order, Product } from '../types/index.ts'

export function useOfflineData() {
  // Operaciones de pedidos
  const createOrder = useCallback(async (order: Omit<Order, 'id' | 'syncStatus' | 'created_at' | 'updatedAt' | 'version' | 'last_modified_at'>) => {
    const now = new Date().toISOString()
    const newOrder: Omit<Order, 'id'> & { id?: string } = {
      ...order,
      syncStatus: 'pending',
      created_at: now,
      updatedAt: now,
      version: 1,
      last_modified_at: now
    }

    const id = await db.orders.add(newOrder as unknown as Order)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'order',
      entityId: id.toString(),
      action: 'create'
    })

    return id
  }, [])

  const updateOrder = useCallback(async (id: number, updates: Partial<Order>) => {
    const now = new Date().toISOString()
    const updatedOrder = {
      ...updates,
      updatedAt: now,
      last_modified_at: now,
      syncStatus: 'pending' as const
    }

    await db.orders.update(id, updatedOrder)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'order',
      entityId: id.toString(),
      action: 'update'
    })
  }, [])

  const deleteOrder = useCallback(async (id: number) => {
    await db.orders.delete(id)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'order',
      entityId: id.toString(),
      action: 'delete'
    })
  }, [])

  const getOrdersByDate = useCallback(async (businessId: string, date: string) => {
    return await db.getOrdersByBusinessAndDate(businessId, date)
  }, [])

  // Operaciones de productos
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt' | 'version' | 'lastModifiedAt'>) => {
    const now = new Date().toISOString()
    const newProduct: Product = {
      ...product,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedAt: now
    }

    const id = await db.products.add(newProduct)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'product',
      entityId: id.toString(),
      action: 'create'
    })

    return id
  }, [])

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    const now = new Date().toISOString()
    const updatedProduct = {
      ...updates,
      updatedAt: now,
      lastModifiedAt: now,
      syncStatus: 'pending' as const
    }

    await db.products.update(id, updatedProduct)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'product',
      entityId: id.toString(),
      action: 'update'
    })
  }, [])

  const deleteProduct = useCallback(async (id: number) => {
    await db.products.delete(id)
    
    // Agregar a la cola de sincronización
    await db.addToSyncQueue({
      entityType: 'product',
      entityId: id.toString(),
      action: 'delete'
    })
  }, [])

  const getProducts = useCallback(async (businessId: string) => {
    return await db.getProductsByBusiness(businessId)
  }, [])

  // Operaciones de limpieza
  const cleanupOldData = useCallback(async () => {
    await db.cleanupOldData()
  }, [])

  const checkDataExpiration = useCallback(async () => {
    return await db.checkDataExpiration()
  }, [])

  return {
    // Orders
    createOrder,
    updateOrder,
    deleteOrder,
    getOrdersByDate,
    
    // Products
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    
    // Maintenance
    cleanupOldData,
    checkDataExpiration
  }
} 