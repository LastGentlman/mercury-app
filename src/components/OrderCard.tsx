import { 
  ChevronRight, 
  Clock, 
  Copy,
  MessageSquare,
  Phone, 
  Share2 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../types/index.ts';
import { Badge } from './ui/badge.tsx';
import { Button } from './ui/button.tsx';
import { Card, CardContent, CardHeader } from './ui/card.tsx';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: Order['status']) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-orange-100 text-orange-800', nextStatus: 'preparing' },
    preparing: { label: 'En Preparación', color: 'bg-blue-100 text-blue-800', nextStatus: 'ready' },
    ready: { label: 'Listo', color: 'bg-green-100 text-green-800', nextStatus: 'delivered' },
    delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800', nextStatus: null },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', nextStatus: null },
  };

  const currentStatus = statusConfig[order.status];
  const canAdvance = currentStatus.nextStatus !== null;

  const handleAdvanceStatus = () => {
    if (canAdvance) {
      const orderId = order.id || order.client_generated_id || '';
      onStatusChange(orderId, currentStatus.nextStatus as Order['status']);
    }
  };

  const handleShareWhatsApp = () => {
    if (!order.client_phone) return;
    const message = generateWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${order.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    globalThis.open(whatsappUrl, '_blank');
  };

  const handleCopyReceipt = () => {
    const receipt = generateWhatsAppMessage(order);
    navigator.clipboard.writeText(receipt);
    toast.success('Recibo copiado al portapapeles');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{order.client_name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              {order.client_phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{order.client_phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  {order.delivery_date ? 
                    new Date(order.delivery_date).toLocaleDateString('es-ES') : 
                    'Sin fecha específica'
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className={currentStatus.color}>
              {currentStatus.label}
            </Badge>
            <p className="text-lg font-bold mt-1">
              ${order.total.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex-1">
                <span className="font-medium">{item.quantity}x</span>
                <span className="ml-2">{item.product_name}</span>
              </div>
              <span className="font-medium">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canAdvance && (
            <Button 
              onClick={handleAdvanceStatus}
              className="flex-1 min-w-[140px]"
            >
              {currentStatus.nextStatus === 'preparing' && 'Comenzar Preparación'}
              {currentStatus.nextStatus === 'ready' && 'Marcar Listo'}
              {currentStatus.nextStatus === 'delivered' && 'Marcar Entregado'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopyReceipt}
          >
            <Copy className="w-4 h-4 mr-1" />
            Copiar
          </Button>
          
          {order.client_phone && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(order: Order): string {
  const items = order.items?.map(item => 
    `${item.quantity}x ${item.product_name} - $${(item.quantity * item.unit_price).toFixed(2)}`
  ).join('\n') || '';

  return `🧾 *Pedido Confirmado*
📅 Fecha: ${new Date(order.delivery_date).toLocaleDateString('es-ES')}

📋 *Detalle:*
${items}

💰 *Total: $${order.total.toFixed(2)}*

¡Gracias por tu pedido! 🎉`;
} 