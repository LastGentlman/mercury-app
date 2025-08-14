import { OrderCard } from './OrderCard.tsx';
import type { Order } from '../../types/index.ts';

const mockOrders: Order[] = [
  {
    id: '1',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'employee-1',
    client_name: 'María González',
    client_phone: '+34612345678',
    total: 45.50,
    delivery_date: '2024-01-15',
    delivery_time: '14:30',
    notes: 'Por favor, llamar antes de llegar',
    status: 'pending',
    last_modified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client_generated_id: 'ORD-001',
    items: [
      {
        id: 1,
        order_id: '1',
        product_name: 'Pizza Margherita',
        quantity: 2,
        unit_price: 12.00,
        subtotal: 24.00
      },
      {
        id: 2,
        order_id: '1',
        product_name: 'Coca Cola',
        quantity: 1,
        unit_price: 2.50,
        subtotal: 2.50
      },
      {
        id: 3,
        order_id: '1',
        product_name: 'Ensalada César',
        quantity: 1,
        unit_price: 19.00,
        subtotal: 19.00
      },
    ]
  },
  {
    id: '2',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'employee-1',
    client_name: 'Carlos Rodríguez',
    client_phone: '+34687654321',
    total: 32.00,
    delivery_date: '2024-01-15',
    delivery_time: '15:00',
    notes: 'Sin cebolla',
    status: 'preparing',
    last_modified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client_generated_id: 'ORD-002',
    items: [
      {
        id: 4,
        order_id: '2',
        product_name: 'Hamburguesa Clásica',
        quantity: 2,
        unit_price: 16.00,
        subtotal: 32.00
      }
    ]
  },
  {
    id: '3',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'employee-1',
    client_name: 'Ana López',
    client_phone: '+34611223344',
    total: 28.50,
    delivery_date: '2024-01-15',
    delivery_time: '16:30',
    notes: '',
    status: 'ready',
    last_modified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client_generated_id: 'ORD-003',
    items: [
      {
        id: 5,
        order_id: '3',
        product_name: 'Pasta Carbonara',
        quantity: 1,
        unit_price: 18.50,
        subtotal: 18.50
      },
      {
        id: 6,
        order_id: '3',
        product_name: 'Agua Mineral',
        quantity: 1,
        unit_price: 2.00,
        subtotal: 2.00
      },
      {
        id: 7,
        order_id: '3',
        product_name: 'Tiramisú',
        quantity: 1,
        unit_price: 8.00,
        subtotal: 8.00
      }
    ]
  },
  {
    id: '4',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'employee-1',
    client_name: 'Luis Martínez',
    client_phone: '+34655443322',
    total: 15.00,
    delivery_date: '2024-01-15',
    delivery_time: '17:00',
    notes: 'Entregar en recepción',
    status: 'delivered',
    last_modified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client_generated_id: 'ORD-004',
    items: [
      {
        id: 8,
        order_id: '4',
        product_name: 'Ensalada Mixta',
        quantity: 1,
        unit_price: 15.00,
        subtotal: 15.00
      }
    ]
  }
];

export function OrderCardDemo() {
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    console.log('Status change:', orderId, newStatus);
  };

  const handleViewDetails = (order: Order) => {
    console.log('View details:', order);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold mb-4">Demo de OrderCard</h2>
      {mockOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={handleStatusChange}
          onViewDetails={handleViewDetails}
        />
      ))}
    </div>
  );
} 