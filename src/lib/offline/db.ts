import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Order, Product, SyncQueueItem } from '../../types'

export class PedidoListDB extends Dexie {
  orders!: Table<Order>
  products!: Table<Product>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('PedidoListDB')
    
    this.version(1).stores({
      orders: '++id, clientGeneratedId, businessId, status, deliveryDate, [businessId+deliveryDate], syncStatus',
      products: '++id, businessId, name',
      syncQueue: '++id, entityType, entityId, action, timestamp, retries'
    })
  }

  // Limpiar datos de más de 30 días
  async cleanupOldData() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    await this.orders
      .where('deliveryDate')
      .below(thirtyDaysAgo.toISOString())
      .delete()
  }

  // Verificar si quedan pocos días de datos
  async checkDataExpiration(): Promise<number> {
    const oldestOrder = await this.orders
      .orderBy('deliveryDate')
      .first()
    
    if (!oldestOrder) return 30
    
    const daysRemaining = Math.floor(
      (new Date().getTime() - new Date(oldestOrder.deliveryDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    
    return Math.max(0, 30 - daysRemaining)
  }

  // Obtener pedidos por negocio y fecha
  async getOrdersByBusinessAndDate(businessId: string, date: string): Promise<Array<Order>> {
    return await this.orders
      .where(['businessId', 'deliveryDate'])
      .equals([businessId, date])
      .toArray()
  }

  // Obtener productos por negocio
  async getProductsByBusiness(businessId: string): Promise<Array<Product>> {
    return await this.products
      .where('businessId')
      .equals(businessId)
      .toArray()
  }

  // Obtener items pendientes de sincronización
  async getPendingSyncItems(): Promise<Array<SyncQueueItem>> {
    return await this.syncQueue
      .where('retries')
      .below(3) // Máximo 3 reintentos
      .toArray()
  }

  // Agregar item a la cola de sincronización
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<number> {
    return await this.syncQueue.add({
      ...item,
      timestamp: new Date().toISOString(),
      retries: 0
    })
  }

  // Marcar item como sincronizado
  async markAsSynced(entityType: 'order' | 'product', entityId: string): Promise<void> {
    await this.syncQueue
      .where(['entityType', 'entityId'])
      .equals([entityType, entityId])
      .delete()
  }

  // Incrementar reintentos de un item
  async incrementRetries(itemId: number, error?: string): Promise<void> {
    await this.syncQueue.update(itemId, {
      retries: (await this.syncQueue.get(itemId))?.retries || 0 + 1,
      lastError: error
    })
  }
}

export const db = new PedidoListDB() 