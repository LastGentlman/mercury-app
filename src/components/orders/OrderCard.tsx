import { Calendar, Clock, MoreVertical, Phone, User } from 'lucide-react';
import type { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onViewDetails?: (order: Order) => void;
  className?: string;
}

export function OrderCard({ 
  order, 
  onStatusChange, 
  onEdit, 
  onViewDetails,
  className 
}: OrderCardProps) {
  const totalAmount = order.items?.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price), 0
  ) || 0;

  const handleStatusClick = () => {
    const statusFlow: Record<Order['status'], Order['status']> = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'delivered',
      'delivered': 'delivered', // No change
      'cancelled': 'cancelled'  // No change
    };
    
    const nextStatus = statusFlow[order.status];
    if (nextStatus !== order.status && onStatusChange) {
      const orderId = order.id || order.client_generated_id || '';
      onStatusChange(orderId, nextStatus);
    }
  };

  const getStatusAction = () => {
    switch (order.status) {
      case 'pending': return 'Iniciar Preparación';
      case 'preparing': return 'Marcar Listo';
      case 'ready': return 'Marcar Entregado';
      case 'delivered': return 'Entregado ✓';
      case 'cancelled': return 'Cancelado';
      default: return 'Actualizar';
    }
  };

  const canAdvanceStatus = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">#{order.client_generated_id}</h3>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              {order.client_name}
              {order.client_phone && (
                <>
                  <Phone className="w-4 h-4 ml-3 mr-1" />
                  {order.client_phone}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(totalAmount)}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Fecha y Hora de Entrega */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(order.delivery_date)}
          </div>
          {order.delivery_time && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(order.delivery_time)}
            </div>
          )}
        </div>

        {/* Items Preview */}
        <div className="space-y-1">
          {order.items?.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.product_name}</span>
              <span>{formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
          ))}
          {order.items && order.items.length > 2 && (
            <div className="text-sm text-muted-foreground">
              +{order.items.length - 2} productos más...
            </div>
          )}
        </div>

        {/* Notas */}
        {order.notes && (
          <div className="bg-muted/50 p-2 rounded text-sm">
            <p className="font-medium mb-1">Notas:</p>
            <p className="text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canAdvanceStatus && onStatusChange && (
            <Button 
              onClick={handleStatusClick}
              className="flex-1"
              size="sm"
            >
              {getStatusAction()}
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(order)}
            >
              Ver Detalles
            </Button>
          )}
          
          {order.status === 'pending' && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onEdit?.(order)}
            >
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 