import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import { useCSRFRequest } from './useCSRF';
import type { Order, OrderItem } from '@/types';
import { db } from '@/lib/offline/db';

interface CreateOrderData {
  client_name: string;
  client_phone?: string;
  delivery_date: string;
  delivery_time?: string;
  notes?: string;
  items: Array<Omit<OrderItem, 'id'>>;
}

export function useOrders(businessId: string) {
  const { isOnline } = useOfflineSync();
  const { csrfRequest } = useCSRFRequest();
  const queryClient = useQueryClient();

  // Default values for missing IDs
  const branchId = 'default-branch';
  const employeeId = 'default-employee';

  // Obtener pedidos del día actual
  const todayOrders = useQuery({
    queryKey: ['orders', 'today', businessId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Obtener de IndexedDB
      const localOrders = await db.getOrdersByBusinessAndDate(businessId, today);

      // Si hay conexión, intentar sincronizar
      if (isOnline) {
        try {
          const response = await csrfRequest(`/api/orders/${businessId}/today`);
          if (response.ok) {
            const serverOrders = await response.json();
            // Merge con datos locales (prioridad a cambios locales no sincronizados)
            return mergeOrders(localOrders, serverOrders);
          }
        } catch (error) {
          console.error('Error obteniendo del servidor:', error);
        }
      }

      return localOrders;
    },
    refetchInterval: isOnline ? 30000 : false,
  });

  // Crear pedido
  const createOrder = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      // Calculate total from items
      const total = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const order = {
        business_id: businessId,
        branch_id: branchId,
        employee_id: employeeId,
        client_name: orderData.client_name,
        client_phone: orderData.client_phone,
        total,
        delivery_date: orderData.delivery_date,
        delivery_time: orderData.delivery_time,
        notes: orderData.notes,
        status: 'pending' as const,
        last_modified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        items: orderData.items,
        syncStatus: 'pending' as const
      };

      // Add to local database first
      const localId = await db.orders.add(order as any);
      const newOrder = { ...order, id: localId.toString() };

      // Add to sync queue
      await db.syncQueue.add({
        entityType: 'order',
        entityId: localId.toString(),
        action: 'create',
        timestamp: new Date().toISOString()
      });

      toast.success(`Pedido creado para ${newOrder.client_name}`);
      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      await db.orders.update(parseInt(orderId), {
        status,
        last_modified_at: new Date().toISOString()
      });

      // Add to sync queue
      await db.syncQueue.add({
        entityType: 'order',
        entityId: orderId,
        action: 'update',
        timestamp: new Date().toISOString()
      });

      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      await db.orders.update(parseInt(orderId), {
        status: 'cancelled',
        last_modified_at: new Date().toISOString()
      });

      // Add to sync queue
      await db.syncQueue.add({
        entityType: 'order',
        entityId: orderId,
        action: 'update',
        timestamp: new Date().toISOString()
      });

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  return {
    orders: todayOrders.data || [],
    isLoading: todayOrders.isLoading,
    error: todayOrders.error,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    refetch: todayOrders.refetch,
  };
}

// Función helper para merge de datos
function mergeOrders(localOrders: Order[], serverOrders: Order[]) {
  const merged = new Map<string, Order>();
  
  // Add local orders
  localOrders.forEach(order => {
    const key = order.id || order.client_generated_id || '';
    if (key) {
      merged.set(key, order);
    }
  });
  
  // Add server orders, overwriting local if newer
  serverOrders.forEach(order => {
    const key = order.id || order.client_generated_id || '';
    if (key) {
      merged.set(key, order);
    }
  });
  
  return Array.from(merged.values());
} 