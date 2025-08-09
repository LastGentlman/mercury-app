import Dexie, { type Table } from 'dexie'
import type { Order, Product, SyncQueueItem, Business, BusinessCategory } from '../../types/index.ts'

export class PedidoListDB extends (Dexie as unknown as new (...args: unknown[]) => {
  version: (v: number) => { stores: (schema: Record<string, string>) => { upgrade: (fn: (tx: unknown) => unknown) => void } };
}) {
  orders!: Table<Order>
  products!: Table<Product>
  businesses!: Table<Business>
  businessCategories!: Table<BusinessCategory>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('PedidoListDB')
    
    // Version 1: Original schema
    this.version(1).stores({
      orders: '++id, clientGeneratedId, businessId, status, deliveryDate, [businessId+deliveryDate], syncStatus',
      products: '++id, businessId, name',
      syncQueue: '++id, entityType, entityId, action, timestamp, retries'
    })

    // Version 2: Add business categories and enhanced product fields
    this.version(2).stores({
      orders: '++id, clientGeneratedId, businessId, status, deliveryDate, [businessId+deliveryDate], syncStatus',
      products: '++id, businessId, name, categoryId, satCode, syncStatus',
      businesses: '++id, businessId, businessType, ownerId',
      businessCategories: '++id, businessId, categoryId, satCode, syncStatus',
      syncQueue: '++id, entityType, entityId, action, timestamp, retries'
    }).upgrade((tx: unknown) => {
      // Migrate existing products to include default values
      return (tx as { products: { toCollection: () => { modify: (fn: (product: unknown) => void) => void } } }).products.toCollection().modify((product: unknown) => {
        const prod = product as { satCode?: string; taxRate?: number };
        if (!prod.satCode) prod.satCode = '50000000';
        if (!prod.taxRate) prod.taxRate = 0.16;
      });
    });
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
      (new Date().getTime() - new Date(oldestOrder.delivery_date).getTime()) / 
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
  async markAsSynced(entityType: 'order' | 'product' | 'business_category', entityId: string): Promise<void> {
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

  // === BUSINESS CATEGORIES METHODS ===

  // Obtener categorías activas por negocio
  async getBusinessCategories(businessId: string): Promise<BusinessCategory[]> {
    return await this.businessCategories
      .where('businessId')
      .equals(businessId)
      .and(cat => cat.isActive)
      .toArray()
  }

  // Agregar nueva categoría de negocio
  async addBusinessCategory(category: Omit<BusinessCategory, 'id'>): Promise<number> {
    const id = await this.businessCategories.add(category)
    
    await this.addToSyncQueue({
      entityType: 'business_category',
      entityId: category.clientGeneratedId || id.toString(),
      action: 'create'
    })
    
    return id
  }

  // Obtener categorías por defecto para tipo de negocio
  async getDefaultCategoriesForBusinessType(businessType: string): Promise<Omit<BusinessCategory, 'id' | 'businessId'>[]> {
    try {
      const { BUSINESS_TYPES } = await import('../constants/businessTypes.ts')
      const businessConfig = BUSINESS_TYPES[businessType as keyof typeof BUSINESS_TYPES]
      
      if (!businessConfig) return []
      
      return businessConfig.categories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon,
        satCode: cat.satCode,
        isActive: true,
        syncStatus: 'pending' as const,
        lastModifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading business types:', error)
      return []
    }
  }

  // Obtener productos con información de categoría
  async getProductsWithCategories(businessId: string): Promise<(Product & { categoryName?: string; categoryIcon?: string })[]> {
    const products = await this.getProductsByBusiness(businessId)
    const categories = await this.getBusinessCategories(businessId)
    
    return products.map(product => {
      const category = categories.find(cat => cat.categoryId === product.categoryId)
      return {
        ...product,
        categoryName: category?.categoryName,
        categoryIcon: category?.icon
      }
    })
  }
}

export const db = new PedidoListDB() 