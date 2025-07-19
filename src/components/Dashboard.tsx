import React from 'react';
import { AlertCircle, CheckCircle, Clock, Package, Plus } from 'lucide-react';
import type { Order } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateOrderDialog } from '@/components/CreateOrderDialog';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderDetails } from '@/components/orders/OrderDetails';

interface DashboardProps {
  businessId: string;
}

export function Dashboard({ businessId }: DashboardProps) {
  const { orders, isLoading, updateOrderStatus } = useOrders(businessId);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = React.useState(false);

  const stats = React.useMemo(() => {
    const today = orders.filter(order => 
      order.deliveryDate === new Date().toISOString().split('T')[0]
    );
    
    return {
      total: today.length,
      pending: today.filter(o => o.status === 'pending').length,
      preparing: today.filter(o => o.status === 'preparing').length,
      ready: today.filter(o => o.status === 'ready').length,
      delivered: today.filter(o => o.status === 'delivered').length,
      cancelled: today.filter(o => o.status === 'cancelled').length,
      totalAmount: today.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      // Ordenar por estado (pending primero) y luego por hora
      const statusOrder = { pending: 0, preparing: 1, ready: 2, delivered: 3, cancelled: 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      
      if (statusDiff !== 0) return statusDiff;
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de Hoy</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">En Preparación</p>
                <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Listos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Entregados</p>
                <p className="text-2xl font-bold text-gray-600">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Total $</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalAmount.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No hay pedidos para hoy
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer pedido para empezar
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Pedido
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedOrders.map(order => (
            <OrderCard 
              key={order.id || order.clientGeneratedId} 
              order={order}
              onStatusChange={(orderId, status) => 
                updateOrderStatus.mutate({ orderId, status })
              }
              onViewDetails={(orderToView) => {
                setSelectedOrder(orderToView);
                setShowOrderDetails(true);
              }}
            />
          ))
        )}
      </div>

      {/* Create Order Dialog */}
      <CreateOrderDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        businessId={businessId}
      />

      {/* Order Details Dialog */}
      <OrderDetails
        order={selectedOrder}
        open={showOrderDetails}
        onOpenChange={setShowOrderDetails}
        onStatusChange={(orderId, status) => 
          updateOrderStatus.mutate({ orderId, status })
        }
      />
    </div>
  );
} 