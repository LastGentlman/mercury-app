import { Calendar, Clock, MessageCircle, Phone, Share2, Trash2, User } from 'lucide-react';
import type { Order } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Separator } from '../ui/separator.tsx';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils.ts';

interface OrderDetailsProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
  onDelete?: (orderId: string) => void;
  onClose?: () => void;
}

export function OrderDetails({ 
  order, 
  onStatusChange, 
  onDelete,
  onClose 
}: OrderDetailsProps) {
  const totalAmount = order.items?.reduce((sum, item) =>
    sum + (item.quantity * item.unit_price), 0
  ) || 0;

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (onStatusChange) {
      const orderId = order.id || order.client_generated_id || '';
      await onStatusChange(orderId, newStatus);
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'En Preparación';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const generateWhatsAppMessage = () => {
    const itemsList = order.items
      ?.map(item => `• ${item.quantity}x ${item.product_name} - ${formatCurrency(item.quantity * item.unit_price)}`)
      .join('\n') || '';

    const receipt = `🧾 *PEDIDO #${order.client_generated_id}*

Cliente: ${order.client_name}
${order.client_phone ? `Teléfono: ${order.client_phone}` : ''}

📅 Entrega: ${formatDate(order.delivery_date)}${order.delivery_time ? ` a las ${formatTime(order.delivery_time)}` : ''}

📦 *Productos:*
${itemsList}

💰 *TOTAL: ${formatCurrency(totalAmount)}*

${order.notes ? `\n📝 Notas: ${order.notes}` : ''}

✅ Gracias por su preferencia
_${new Date().toLocaleString('es-MX')}_`;

    return receipt;
  };

  const handleShareWhatsApp = () => {
    if (!order.client_phone) {
      alert('No hay número de teléfono para enviar WhatsApp');
      return;
    }

    const message = `Hola ${order.client_name}! 👋

Tu pedido #${order.client_generated_id} está *${getStatusText(order.status).toUpperCase()}*

📅 Entrega: ${formatDate(order.delivery_date)}

¡Gracias por tu pedido! 🎉`;

    const whatsappUrl = `https://wa.me/${order.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    globalThis.open(whatsappUrl, '_blank');
  };

  const handleCopyReceipt = () => {
    const receipt = generateWhatsAppMessage();
    navigator.clipboard.writeText(receipt);
    alert('Recibo copiado al portapapeles');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Pedido #{order.client_generated_id}</span>
          </CardTitle>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Client Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Información del Cliente</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="font-medium">{order.client_name}</span>
            </div>
            {order.client_phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{order.client_phone}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Delivery Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Información de Entrega</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(order.delivery_date)}</span>
            </div>
            {order.delivery_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(order.delivery_time)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">
            Productos ({order.items?.length || 0})
          </h3>
          <div className="space-y-2">
            {order.items?.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center py-2 ${
                  index !== (order.items?.length || 0) - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>

        {/* Notes */}
        {order.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Notas</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {onStatusChange && (
            <Button 
              onClick={() => handleStatusChange('delivered')}
              className="flex-1"
            >
              Marcar como Entregado
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleCopyReceipt}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copiar Recibo
          </Button>
          
          {order.client_phone && (
            <Button 
              variant="outline" 
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={() => {
                const orderId = order.id || order.client_generated_id || '';
                onDelete(orderId);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 