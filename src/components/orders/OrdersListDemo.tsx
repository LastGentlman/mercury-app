import { useState } from 'react';
import type { Order } from '../../types/index.ts';
import { OrdersList } from './OrdersList.tsx';

// ✅ NUEVO: Datos de ejemplo para el demo
const mockOrders: Order[] = [
  {
    id: '1',
    business_id: 'demo-business-id',
    branch_id: 'demo-branch-id',
    employee_id: 'demo-employee-id',
    client_name: 'Juan Pérez',
    client_phone: '+52 123 456 7890',
    total: 150.00,
    delivery_date: '2024-01-15',
    delivery_time: '14:00',
    notes: 'Entregar en la puerta principal',
    status: 'pending',
    client_generated_id: 'ORD-001',
    last_modified_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T09:30:00Z',
    items: [
      {
        id: 1,
        order_id: '1',
        product_name: 'Pizza Margherita',
        quantity: 2,
        unit_price: 75.00,
        subtotal: 150.00
      }
    ]
  },
  {
    id: '2',
    business_id: 'demo-business-id',
    branch_id: 'demo-branch-id',
    employee_id: 'demo-employee-id',
    client_name: 'María García',
    client_phone: '+52 987 654 3210',
    total: 85.50,
    delivery_date: '2024-01-15',
    delivery_time: '15:30',
    notes: '',
    status: 'preparing',
    client_generated_id: 'ORD-002',
    last_modified_at: '2024-01-15T11:00:00Z',
    created_at: '2024-01-15T10:45:00Z',
    items: [
      {
        id: 2,
        order_id: '2',
        product_name: 'Hamburguesa Clásica',
        quantity: 1,
        unit_price: 45.50,
        subtotal: 45.50
      },
      {
        id: 3,
        order_id: '2',
        product_name: 'Papas Fritas',
        quantity: 1,
        unit_price: 40.00,
        subtotal: 40.00
      }
    ]
  }
];

export function OrdersListDemo() {
  const [orders] = useState<Order[]>(mockOrders);

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    console.log('Status change:', orderId, status);
    // Aquí podrías implementar la lógica real de cambio de estado
  };

  const handleEdit = (order: Order) => {
    console.log('Edit order:', order);
    // Aquí podrías abrir un modal de edición
  };

  const handleDelete = (orderId: string) => {
    console.log('Delete order:', orderId);
    // Aquí podrías implementar la lógica de eliminación
  };

  const handleViewDetails = (order: Order) => {
    console.log('View details:', order);
    // Aquí podrías abrir un modal de detalles
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Demo de OrdersList</h2>
      <OrdersList
        orders={orders}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
} 