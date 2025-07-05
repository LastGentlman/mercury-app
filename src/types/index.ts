// Types for offline database entities

export interface Order {
  id?: number
  clientGeneratedId: string
  businessId: string
  clientName: string
  clientPhone: string
  clientAddress: string
  items: Array<OrderItem>
  total: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  deliveryDate: string
  notes?: string
  syncStatus: 'pending' | 'synced' | 'error'
  createdAt: string
  updatedAt: string
  modifiedBy?: string
  version?: number // Para control de versiones
  lastModifiedAt?: string // Timestamp de última modificación para conflictos
}

export interface OrderItem {
  id?: number
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Product {
  id?: number
  businessId: string
  name: string
  description?: string
  price: number
  category?: string
  isActive: boolean
  syncStatus: 'pending' | 'synced' | 'error'
  createdAt: string
  updatedAt: string
  version?: number // Para control de versiones
  lastModifiedAt?: string // Timestamp de última modificación para conflictos
}

export interface SyncQueueItem {
  id?: number
  entityType: 'order' | 'product'
  entityId: string
  action: 'create' | 'update' | 'delete'
  timestamp: string
  retries?: number
  lastError?: string
}

export interface User {
  id: string
  email: string
  name?: string
  businessId?: string
  role: 'owner' | 'employee'
}

export interface Business {
  id: string
  name: string
  ownerId: string
  address?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
} 