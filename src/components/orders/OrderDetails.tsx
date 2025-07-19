import { useState } from 'react';
import { 
  Calendar,
  Clock,
  Copy,
  Edit3,
  FileText,
  MessageCircle,
  Package,
  Phone,
  Trash2,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
}

export function OrderDetails({ 
  order, 
  open, 
  onOpenChange,
  onStatusChange,
  onEdit,
  onDelete
}: OrderDetailsProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!order) return null;

  const totalAmount = order.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  ) || 0;

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!onStatusChange) return;
    
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(order.id?.toString() || order.clientGeneratedId, newStatus);
      toast.success(`Pedido marcado como ${getStatusText(newStatus)}`);
    } catch (error) {
      toast.error('Error al actualizar el estado');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusText = (status: Order['status']) => {
    const texts = {
      'pending': 'pendiente',
      'preparing': 'en preparación',
      'ready': 'listo',
      'delivered': 'entregado',
      'cancelled': 'cancelado'
    };
    return texts[status];
  };

  const generateReceipt = () => {
    const itemsList = order.items
      .map(item => `• ${item.quantity}x ${item.productName} - ${formatCurrency(item.quantity * item.unitPrice)}`)
      .join('\n') || '';

    const receipt = `🧾 *PEDIDO #${order.folio || order.clientGeneratedId}*
    
Cliente: ${order.clientName}
${order.clientPhone ? `Teléfono: ${order.clientPhone}` : ''}

📅 Entrega: ${formatDate(order.deliveryDate)}${order.deliveryTime ? ` a las ${formatTime(order.deliveryTime)}` : ''}

📦 *Productos:*
${itemsList}

💰 *TOTAL: ${formatCurrency(totalAmount)}*

${order.notes ? `\n📝 Notas: ${order.notes}` : ''}

✅ Estado: ${getStatusText(order.status).toUpperCase()}
_${new Date().toLocaleString('es-MX')}_`;

    navigator.clipboard.writeText(receipt);
    toast.success('Recibo copiado al portapapeles');
  };

  const shareWhatsApp = () => {
    if (!order.clientPhone) {
      toast.error('No hay número de teléfono para este cliente');
      return;
    }

    const message = `Hola ${order.clientName}! 👋

Tu pedido #${order.folio || order.clientGeneratedId} está *${getStatusText(order.status).toUpperCase()}*

📦 Total: ${formatCurrency(totalAmount)}
📅 Entrega: ${formatDate(order.deliveryDate)}

¡Gracias por tu preferencia! 🙏`;

    const whatsappUrl = `https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getAvailableStatusTransitions = () => {
    const transitions: Array<{ status: Order['status']; label: string; variant: 'default' | 'secondary' | 'destructive' }> = [];
    
    switch (order.status) {
      case 'pending':
        transitions.push(
          { status: 'preparing', label: 'Iniciar Preparación', variant: 'default' },
          { status: 'cancelled', label: 'Cancelar Pedido', variant: 'destructive' }
        );
        break;
      case 'preparing':
        transitions.push(
          { status: 'ready', label: 'Marcar como Listo', variant: 'default' },
          { status: 'cancelled', label: 'Cancelar Pedido', variant: 'destructive' }
        );
        break;
      case 'ready':
        transitions.push(
          { status: 'delivered', label: 'Marcar como Entregado', variant: 'default' }
        );
        break;
    }
    
    return transitions;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Pedido #{order.folio || order.clientGeneratedId}</span>
              <StatusBadge status={order.status} size="md" />
            </div>
            <Badge variant="secondary" className="font-mono text-lg">
              {formatCurrency(totalAmount)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{order.clientName}</span>
              </div>
              {order.clientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{order.clientPhone}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={shareWhatsApp}
                    className="ml-auto"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Información de Entrega */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Información de Entrega
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(order.deliveryDate)}</span>
              </div>
              {order.deliveryTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatTime(order.deliveryTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos ({order.items.length || 0})
            </h3>
            <div className="border rounded-lg">
              {order.items.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-4 flex justify-between items-center ${
                    index !== (order.items.length || 0) - 1 ? 'border-b' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-muted/50 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Acciones */}
          <div className="space-y-4">
            {/* Cambios de Estado */}
            {getAvailableStatusTransitions().length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Cambiar Estado:</h4>
                <div className="flex gap-2 flex-wrap">
                  {getAvailableStatusTransitions().map(({ status, label, variant }) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={variant}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? 'Actualizando...' : label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Otras Acciones */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={generateReceipt}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Recibo
              </Button>

              {order.status === 'pending' && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onEdit(order);
                    onOpenChange(false);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Pedido
                </Button>
              )}

              {['pending', 'cancelled'].includes(order.status) && onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
                      onDelete(order.id?.toString() || order.clientGeneratedId);
                      onOpenChange(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 