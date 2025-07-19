import { useMemo, useState } from 'react';
import { 
  Download,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import { OrderCard } from './OrderCard';
import { OrderDetails } from './OrderDetails';
import type { Order } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type SortField = 'deliveryDate' | 'folio' | 'clientName' | 'total';
type SortDirection = 'asc' | 'desc';

interface OrdersListProps {
  businessId: string;
  onCreateOrder?: () => void;
  onEditOrder?: (order: Order) => void;
}

export function OrdersList({ businessId, onCreateOrder, onEditOrder }: OrdersListProps) {
  // State para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'all'
  const [sortField, setSortField] = useState<SortField>('deliveryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // State para detalles
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Hook de órdenes
  const { 
    orders, 
    isLoading, 
    error,
    updateOrderStatus,
    deleteOrder,
    refetch
  } = useOrders(businessId);

  // Filtros y ordenamiento
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      // Filtro de búsqueda
      const matchesSearch = searchTerm === '' || 
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.folio && order.folio.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.clientPhone && order.clientPhone.includes(searchTerm));

      // Filtro de estado
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Filtro de fecha
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today': {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDate = orderDate >= today && orderDate < tomorrow;
            break;
          }
          case 'week': {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = orderDate >= weekAgo;
            break;
          }
          case 'month': {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = orderDate >= monthAgo;
            break;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'deliveryDate':
          aValue = new Date(a.deliveryDate).getTime();
          bValue = new Date(b.deliveryDate).getTime();
          break;
        case 'folio':
          aValue = a.folio ?? '';
          bValue = b.folio ?? '';
          break;
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  // Stats para el header
  const stats = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc.total++;
      acc[order.status]++;
      return acc;
    }, { total: 0, pending: 0, preparing: 0, ready: 0, delivered: 0, cancelled: 0 });
  }, [orders]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status: newStatus });
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder.mutateAsync(orderId);
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar los pedidos. 
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Pedidos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} pedidos en total
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={onCreateOrder}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Pedido
              </Button>
            </div>
          </div>
          
          {/* Stats badges */}
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">
              Pendientes: {stats.pending}
            </Badge>
            <Badge variant="secondary">
              En Preparación: {stats.preparing}
            </Badge>
            <Badge variant="secondary">
              Listos: {stats.ready}
            </Badge>
            <Badge variant="secondary">
              Entregados: {stats.delivered}
            </Badge>
            {stats.cancelled > 0 && (
              <Badge variant="secondary">
                Cancelados: {stats.cancelled}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por cliente, folio o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro de estado */}
            <Select value={statusFilter} onValueChange={(value: Order['status'] | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="preparing">En Preparación</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de fecha */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenamiento */}
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
              const [field, direction] = value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deliveryDate-desc">Fecha ↓</SelectItem>
                <SelectItem value="deliveryDate-asc">Fecha ↑</SelectItem>
                <SelectItem value="folio-desc">Folio ↓</SelectItem>
                <SelectItem value="folio-asc">Folio ↑</SelectItem>
                <SelectItem value="clientName-asc">Cliente A-Z</SelectItem>
                <SelectItem value="clientName-desc">Cliente Z-A</SelectItem>
                <SelectItem value="total-desc">Total ↓</SelectItem>
                <SelectItem value="total-asc">Total ↑</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredAndSortedOrders.length === 0 ? (
          // Empty state
          <EmptyState
            title={searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
              ? "No se encontraron pedidos" 
              : "No hay pedidos aún"
            }
            description={searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza creando tu primer pedido"
            }
            icon={<Search className="w-16 h-16" />}
            action={
              searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              ) : (
                <Button onClick={onCreateOrder}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Pedido
                </Button>
              )
            }
          />
        ) : (
          // Lista de pedidos
          <>
            {/* Resultados info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredAndSortedOrders.length} de {orders.length} pedidos
              </span>
              
              {/* Export button */}
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Cards de pedidos */}
            {filteredAndSortedOrders.map((order) => (
              <OrderCard
                key={order.id || order.clientGeneratedId}
                order={order}
                onStatusChange={handleStatusChange}
                onEdit={onEditOrder}
                onDelete={handleDeleteOrder}
                onViewDetails={handleViewDetails}
              />
            ))}

            {/* TODO: Paginación si hay muchos pedidos */}
            {filteredAndSortedOrders.length > 20 && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center text-muted-foreground">
                    <p>Mostrando los primeros 20 resultados</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Cargar más
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal de detalles */}
      <OrderDetails
        order={selectedOrder}
        open={showDetails}
        onOpenChange={setShowDetails}
        onStatusChange={handleStatusChange}
        onEdit={onEditOrder}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
} 