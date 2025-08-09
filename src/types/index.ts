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
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  client_generated_id?: string;
  last_modified_at: string;
  modified_by?: string;
  created_at: string;
  items?: Array<OrderItem>;
  
  // ✅ COMPATIBILIDAD: Para compatibilidad con offline y formularios
  clientGeneratedId?: string;
  syncStatus?: 'pending' | 'synced' | 'error';
  version?: number;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

// ✅ NUEVO: Tipos unificados para formularios
export interface CreateOrderData {
  client_name: string;
  client_phone?: string;
  delivery_date: string;
  delivery_time?: string;
  notes?: string;
  items: Array<Omit<OrderItem, 'id' | 'order_id'>>;
}

export interface OrderFormData {
  clientName: string;
  clientPhone?: string;
  deliveryDate: string;
  deliveryTime?: string;
  notes?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
}

// ✅ NUEVO: Función helper para convertir entre tipos
export function convertFormDataToCreateOrderData(formData: OrderFormData): CreateOrderData {
  return {
    client_name: formData.clientName,
    ...(formData.clientPhone && { client_phone: formData.clientPhone }),
    delivery_date: formData.deliveryDate,
    ...(formData.deliveryTime && { delivery_time: formData.deliveryTime }),
    ...(formData.notes && { notes: formData.notes }),
    items: formData.items.map(item => ({
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      ...(item.notes && { notes: item.notes })
    }))
  };
}

export interface Product {
  id?: number;
  businessId: string;
  business_id?: string; // For API compatibility
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category?: string; // Legacy field - use categoryId instead
  categoryId?: string; // New dynamic category reference
  satCode?: string; // SAT code for Mexican tax compliance
  taxRate?: number; // Tax rate (0.16 = 16% IVA)
  stock: number;
  image_url?: string;
  isActive: boolean;
  is_active?: boolean; // For API compatibility
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  created_at?: string; // For API compatibility
  updatedAt: string;
  lastModifiedAt?: string; // Timestamp de última modificación para conflictos
  clientGeneratedId?: string; // Client-generated ID for offline sync
  version?: number; // Para control de versiones
}

export interface SyncQueueItem {
  id?: number;
  entityType: 'order' | 'product' | 'business_category';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
  retries?: number;
  lastError?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  businessId?: string;
  role?: 'owner' | 'employee';
  avatar_url?: string;
  provider?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  owner_id?: string; // For API compatibility
  businessType?: string; // Type of business (restaurant, cafe, retail, etc.)
  business_type?: string; // For API compatibility
  taxRegimeCode?: string; // SAT tax regime code
  tax_regime_code?: string; // For API compatibility
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  created_at?: string; // For API compatibility
  updatedAt: string;
  updated_at?: string; // For API compatibility
}

export interface BusinessCategory {
  id?: number;
  businessId: string;
  business_id?: string; // For API compatibility
  categoryId: string;
  category_id?: string; // For API compatibility
  categoryName: string;
  category_name?: string; // For API compatibility
  icon: string;
  satCode: string;
  sat_code?: string; // For API compatibility
  isActive: boolean;
  is_active?: boolean; // For API compatibility
  clientGeneratedId?: string;
  client_generated_id?: string; // For API compatibility
  syncStatus: 'pending' | 'synced' | 'error';
  sync_status?: string; // For API compatibility
  lastModifiedAt: string;
  last_modified_at?: string; // For API compatibility
  createdAt: string;
  created_at?: string; // For API compatibility
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  business_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 