// Types for offline database entities

export interface Order {
  id: string;
  business_id: string;
  branch_id: string;
  employee_id: string;
  client_name: string;
  client_phone?: string;
  total: number;
  delivery_date: string;
  delivery_time?: string;
  notes?: string;
  // ✅ CAMBIO PRINCIPAL: Unificar status types
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  client_generated_id?: string;
  last_modified_at: string;
  modified_by?: string;
  created_at: string;
  items?: Array<OrderItem>;
  
  // ✅ AÑADIR: Para compatibilidad con offline
  clientGeneratedId?: string;
  syncStatus?: 'pending' | 'synced' | 'error';
}

export interface OrderItem {
  id?: number
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Product {
  id?: number
  businessId: string
  business_id?: string // For API compatibility
  name: string
  description?: string
  price: number
  cost?: number
  category?: string
  stock: number
  image_url?: string
  isActive: boolean
  is_active?: boolean // For API compatibility
  syncStatus: 'pending' | 'synced' | 'error'
  createdAt: string
  created_at?: string // For API compatibility
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