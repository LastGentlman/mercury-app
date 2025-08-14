import { useState, useMemo } from 'react';
import { Search, SortAsc, SortDesc } from 'lucide-react';
import type { Order } from '../../types/index.ts';
import { OrderCard } from './OrderCard.tsx';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';

interface OrdersListProps {
  orders: Order[];
  onStatusChange?: (orderId: string, status: Order['status']) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onViewDetails?: (order: Order) => void;
  className?: string;
}

type SortField = 'date' | 'folio' | 'client' | 'status' | 'total';
type SortDirection = 'asc' | 'desc';

export function OrdersList({ 
  orders, 
  onStatusChange, 
  onEdit, 
  onDelete,
  onViewDetails,
  className 
}: OrdersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client_generated_id && order.client_generated_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.client_phone && order.client_phone.includes(searchTerm))
    );
  }, [orders, searchTerm]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.delivery_date).getTime();
          bValue = new Date(b.delivery_date).getTime();
          break;
        case 'folio':
          aValue = a.client_generated_id ?? undefined;
          bValue = b.client_generated_id ?? undefined;
          break;
        case 'client':
          aValue = a.client_name.toLowerCase();
          bValue = b.client_name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return Number(aValue) > Number(bValue) ? 1 : -1;
      } else {
        return Number(aValue) < Number(bValue) ? 1 : -1;
      }
    });
  }, [filteredOrders, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0
    };

    filteredOrders.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={className}>
      {/* Header with search and stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pedidos ({filteredOrders.length})</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusCounts.pending} Pendientes</Badge>
              <Badge variant="outline">{statusCounts.preparing} En Preparación</Badge>
              <Badge variant="outline">{statusCounts.ready} Listos</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, folio o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('date')}
                className="flex items-center gap-1"
              >
                Fecha
                {sortField === 'date' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('client')}
                className="flex items-center gap-1"
              >
                Cliente
                {sortField === 'client' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('total')}
                className="flex items-center gap-1"
              >
                Total
                {sortField === 'total' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron pedidos con esos criterios' : 'No hay pedidos para mostrar'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange || (() => {})}
              onEdit={onEdit || (() => {})}
              onDelete={onDelete || (() => {})}
              onViewDetails={onViewDetails || (() => {})}
            />
          ))
        )}
      </div>
    </div>
  );
} 