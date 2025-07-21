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
    client_phone: formData.clientPhone,
    delivery_date: formData.deliveryDate,
    delivery_time: formData.deliveryTime,
    notes: formData.notes,
    items: formData.items.map(item => ({
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      notes: item.notes
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
  category?: string;
  stock: number;
  image_url?: string;
  isActive: boolean;
  is_active?: boolean; // For API compatibility
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  created_at?: string; // For API compatibility
  updatedAt: string;
  version?: number; // Para control de versiones
  lastModifiedAt?: string; // Timestamp de última modificación para conflictos
}

export interface SyncQueueItem {
  id?: number;
  entityType: 'order' | 'product';
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
  role: 'owner' | 'employee';
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
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