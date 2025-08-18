import React from 'react';
import { AlertCircle, CheckCircle, Clock, Package, Plus, TrendingUp, Users } from 'lucide-react';
import type { Order } from '../types/index.ts';
import { useOrders } from '../hooks/useOrders.ts';
import { useDashboardStats } from '../hooks/useDashboardStats.ts';
import { Button } from './ui/index.ts';
import { Card, CardContent } from './ui/index.ts';
import { CreateOrderDialog } from './CreateOrderDialog.tsx';
import { OrderCard } from './orders/OrderCard.tsx';
import { OrderDetails } from './orders/OrderDetails.tsx';

interface DashboardProps {
  businessId: string;
}

export function Dashboard({ businessId }: DashboardProps) {
  const { orders, isLoading, updateOrderStatus } = useOrders(businessId);
  const { stats: dashboardStats, isLoading: _statsLoading } = useDashboardStats();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = React.useState(false);

  // Use dashboard stats if available, otherwise fall back to local calculation
  const stats = React.useMemo(() => {
    if (dashboardStats) {
      return {
        total: dashboardStats.today.total,
        pending: dashboardStats.today.pending,
        preparing: dashboardStats.today.preparing,
        ready: dashboardStats.today.ready,
        delivered: dashboardStats.today.delivered,
        cancelled: dashboardStats.today.cancelled,
        totalAmount: dashboardStats.today.totalAmount,
      };
    }

    // Fallback to local calculation
    const today = orders.filter((order: Order) => 
      order.delivery_date === new Date().toISOString().split('T')[0]
    );
    
    return {
      total: today.length,
      pending: today.filter((o: Order) => o.status === 'pending').length,
      preparing: today.filter((o: Order) => o.status === 'preparing').length,
      ready: today.filter((o: Order) => o.status === 'ready').length,
      delivered: today.filter((o: Order) => o.status === 'delivered').length,
      cancelled: today.filter((o: Order) => o.status === 'cancelled').length,
      totalAmount: today.reduce((sum: number, order: Order) => sum + order.total, 0),
    };
  }, [orders, dashboardStats]);

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a: Order, b: Order) => {
      // Ordenar por estado (pending primero) y luego por hora
      const statusOrder: Record<Order['status'], number> = { pending: 0, preparing: 1, ready: 2, delivered: 3, cancelled: 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      
      if (statusDiff !== 0) return statusDiff;
      
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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

      {/* Enhanced Stats Cards */}
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
      </div>

      {/* Additional Stats from Dashboard API */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Crecimiento Pedidos</p>
                  <p className={`text-lg font-bold ${dashboardStats.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardStats.growth.orders >= 0 ? '+' : ''}{dashboardStats.growth.orders}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Crecimiento Ingresos</p>
                  <p className={`text-lg font-bold ${dashboardStats.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardStats.growth.revenue >= 0 ? '+' : ''}{dashboardStats.growth.revenue}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Productos Activos</p>
                  <p className="text-lg font-bold text-purple-600">{dashboardStats.totals.products}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Clientes Registrados</p>
                  <p className="text-lg font-bold text-indigo-600">{dashboardStats.totals.clients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
      {selectedOrder && showOrderDetails && (
        <OrderDetails
          order={selectedOrder}
          onStatusChange={(orderId, status) => 
            updateOrderStatus.mutate({ orderId, status })
          }
          onClose={() => {
            setSelectedOrder(null);
            setShowOrderDetails(false);
          }}
        />
      )}
    </div>
  );
} 