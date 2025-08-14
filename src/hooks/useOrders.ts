import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync.ts';
import { useCSRFRequest } from './useCSRF.ts';
import type { Order, CreateOrderData, OrderFormData } from '../types/index.ts';
import { convertFormDataToCreateOrderData } from '../types/index.ts';
import { db } from '../lib/offline/db.ts';

// ✅ ACTUALIZADO: Usar tipos unificados del archivo de tipos
// interface CreateOrderData ya está definida en @/types

export function useOrders(businessId: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineSync();
  const { csrfRequest } = useCSRFRequest();

  // Obtener pedidos
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', businessId],
    queryFn: async () => {
      if (isOnline) {
        const response = await csrfRequest(`/api/orders?businessId=${businessId}`);
        if (!response.ok) throw new Error('Error fetching orders');
        return response.json();
      } else {
        // Fallback a datos offline
        return await db.getOrdersByBusinessAndDate(businessId, new Date().toISOString().split('T')[0] || '');
      }
    },
    staleTime: 30000, // 30 segundos
  });

  // ✅ ACTUALIZADO: Crear pedido usando tipos unificados
  const createOrder = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      // Calculate total from items
      const total = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const order = {
        business_id: businessId,
        branch_id: 'default-branch', // TODO: Get from context
        employee_id: 'default-employee', // TODO: Get from context
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
      const localId = await db.orders.add(order as unknown as Order);
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

  // ✅ NUEVO: Función helper para crear pedido desde formulario
  const createOrderFromForm = useMutation({
    mutationFn: (formData: OrderFormData) => {
      const orderData = convertFormDataToCreateOrderData(formData);
      return createOrder.mutateAsync(orderData);
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

  return {
    orders,
    isLoading,
    error,
    createOrder,
    createOrderFromForm, // ✅ NUEVO: Para usar con formularios
    updateOrderStatus
  };
} 