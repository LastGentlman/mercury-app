import { OrderCard } from './OrderCard';
import type { Order } from '@/types';

// Sample order data for demonstration
const sampleOrder: Order = {
  id: 1,
  clientGeneratedId: 'ORD-001',
  folio: '2024-001',
  businessId: 'business-1',
  clientName: 'Juan Pérez',
  clientPhone: '+52 55 1234 5678',
  clientAddress: 'Av. Reforma 123, CDMX',
  items: [
    {
      id: 1,
      productId: 'prod-1',
      productName: 'Pizza Margherita',
      quantity: 2,
      unitPrice: 180.00,
      total: 360.00
    },
    {
      id: 2,
      productId: 'prod-2',
      productName: 'Coca Cola 600ml',
      quantity: 3,
      unitPrice: 25.00,
      total: 75.00
    },
    {
      id: 3,
      productId: 'prod-3',
      productName: 'Ensalada César',
      quantity: 1,
      unitPrice: 120.00,
      total: 120.00
    }
  ],
  total: 555.00,
  status: 'pending',
  deliveryDate: '2024-01-15',
  deliveryTime: '19:30',
  notes: 'Por favor entregar en la puerta principal. No tocar el timbre después de las 8 PM.',
  syncStatus: 'synced',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

const sampleOrderPreparing: Order = {
  ...sampleOrder,
  id: 2,
  clientGeneratedId: 'ORD-002',
  folio: '2024-002',
  clientName: 'María García',
  status: 'preparing',
  deliveryTime: '20:00',
  notes: 'Sin cebolla en la pizza'
};

const sampleOrderReady: Order = {
  ...sampleOrder,
  id: 3,
  clientGeneratedId: 'ORD-003',
  folio: '2024-003',
  clientName: 'Carlos López',
  status: 'ready',
  deliveryTime: '18:45'
};

const sampleOrderDelivered: Order = {
  ...sampleOrder,
  id: 4,
  clientGeneratedId: 'ORD-004',
  folio: '2024-004',
  clientName: 'Ana Martínez',
  status: 'delivered',
  deliveryTime: '17:30'
};

export function OrderCardDemo() {
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    console.log(`Order ${orderId} status changed to: ${newStatus}`);
  };

  const handleEdit = (order: Order) => {
    console.log('Edit order:', order);
  };

  const handleDelete = (orderId: string) => {
    console.log('Delete order:', orderId);
  };

  const handleViewDetails = (order: Order) => {
    console.log('View details for order:', order);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">OrderCard Demo</h1>
        <p className="text-muted-foreground mb-6">
          This demonstrates the new OrderCard component with different order statuses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OrderCard
          order={sampleOrder}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
        
        <OrderCard
          order={sampleOrderPreparing}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
        
        <OrderCard
          order={sampleOrderReady}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
        
        <OrderCard
          order={sampleOrderDelivered}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
} 