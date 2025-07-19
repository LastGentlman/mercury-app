import { OrdersList } from './OrdersList';

export function OrdersListDemo() {
  const handleCreateOrder = () => {
    console.log('Create new order');
    // Navigate to create order form or open modal
  };

  const handleEditOrder = (order: any) => {
    console.log('Edit order:', order);
    // Navigate to edit order form or open modal
  };

  return (
    <div className="container mx-auto p-6">
      <OrdersList
        businessId="demo-business-id"
        onCreateOrder={handleCreateOrder}
        onEditOrder={handleEditOrder}
      />
    </div>
  );
} 