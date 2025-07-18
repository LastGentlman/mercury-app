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
  const totalAmount = order.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
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
      onStatusChange(order.id?.toString() || order.clientGeneratedId, nextStatus);
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
              <h3 className="font-semibold text-lg">#{order.folio || order.clientGeneratedId}</h3>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              {order.clientName}
              {order.clientPhone && (
                <>
                  <Phone className="w-4 h-4 ml-3 mr-1" />
                  {order.clientPhone}
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
            {formatDate(order.deliveryDate)}
          </div>
          {order.deliveryTime && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(order.deliveryTime)}
            </div>
          )}
        </div>

        {/* Items Preview */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Productos:</p>
          <div className="text-sm text-muted-foreground">
            {order.items.slice(0, 2).map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.productName}</span>
                <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs text-muted-foreground italic">
                +{order.items.length - 2} productos más...
              </p>
            )}
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <div className="bg-muted/50 p-2 rounded text-sm">
            <p className="font-medium mb-1">Notas:</p>
            <p className="text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canAdvanceStatus && (
            <Button 
              size="sm" 
              variant={order.status === 'ready' ? 'default' : 'secondary'}
              onClick={handleStatusClick}
              className="flex-1"
            >
              {getStatusAction()}
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onViewDetails?.(order)}
          >
            Ver Detalles
          </Button>
          
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