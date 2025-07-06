import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import type { Order, OrderItem } from '@/types';
import { db } from '@/lib/offline/db';

interface CreateOrderData {
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  deliveryDate: string;
  deliveryTime?: string;
  notes?: string;
  items: Array<Omit<OrderItem, 'id'>>;
}

export function useOrders(businessId: string) {
  const { isOnline } = useOfflineSync();
  const queryClient = useQueryClient();

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
          const response = await fetch(`/api/orders/${businessId}/today`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
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
      const clientGeneratedId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const total = orderData.items.reduce((sum, item) => sum + item.total, 0);

      const newOrder: Order = {
        clientGeneratedId,
        businessId,
        clientName: orderData.clientName,
        clientPhone: orderData.clientPhone || '',
        clientAddress: orderData.clientAddress || '',
        total,
        status: 'pending',
        deliveryDate: orderData.deliveryDate,
        notes: orderData.notes,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: orderData.items.map(item => ({
          ...item,
          id: undefined, // Dexie auto-genera el ID
        })),
      };

      // Guardar en IndexedDB primero
      const orderId = await db.orders.add(newOrder);

      // Agregar a la cola de sincronización
      await db.addToSyncQueue({
        entityType: 'order',
        entityId: orderId.toString(),
        action: 'create'
      });

      // Si hay conexión, intentar sincronizar inmediatamente
      if (isOnline) {
        try {
          const response = await fetch(`/api/orders`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newOrder),
          });

          if (response.ok) {
            const serverOrder = await response.json();
            // Actualizar con ID del servidor
            await db.orders.update(orderId, { 
              id: serverOrder.id,
              syncStatus: 'synced' 
            });
            
            // Marcar como sincronizado en la cola
            await db.markAsSynced('order', orderId.toString());
            
            // Trigger notificación push
            await fetch(`/api/notifications/new-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId: serverOrder.id, 
                businessId 
              }),
            });
          }
        } catch (error) {
          console.error('Error sincronizando:', error);
        }
      }

      return { ...newOrder, id: orderId };
    },
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'today', businessId] });
      toast.success(`Pedido creado para ${newOrder.clientName}`);
    },
    onError: (error) => {
      toast.error('Error al crear el pedido');
      console.error('Error creating order:', error);
    },
  });

  // Cambiar estado de pedido
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      await db.orders.update(parseInt(orderId), { 
        status,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString()
      });

      // Agregar a la cola de sincronización
      await db.addToSyncQueue({
        entityType: 'order',
        entityId: orderId,
        action: 'update'
      });

      if (isOnline) {
        try {
          await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status }),
          });
          
          await db.orders.update(parseInt(orderId), { syncStatus: 'synced' });
          await db.markAsSynced('order', orderId);
        } catch (error) {
          console.error('Error sincronizando estado:', error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'today', businessId] });
      toast.success('Estado actualizado');
    },
  });

  return {
    orders: todayOrders.data || [],
    isLoading: todayOrders.isLoading,
    createOrder,
    updateOrderStatus,
    refetch: todayOrders.refetch,
  };
}

// Función helper para merge de datos
function mergeOrders(localOrders: Array<Order>, serverOrders: Array<Order>): Array<Order> {
  const merged = new Map<string, Order>();
  
  // Agregar pedidos del servidor
  serverOrders.forEach(order => {
    const key = order.id?.toString() || order.clientGeneratedId;
    merged.set(key, order);
  });
  
  // Sobrescribir con datos locales (prioridad a cambios no sincronizados)
  localOrders.forEach(order => {
    const key = order.id?.toString() || order.clientGeneratedId;
    if (order.syncStatus === 'pending') {
      merged.set(key, order);
    }
  });
  
  return Array.from(merged.values());
} 