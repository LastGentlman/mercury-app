
import { 
  Clock, 
  Copy,
  Edit,
  MessageSquare,
  Phone, 
  Share2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/ui-utils'

interface EnhancedOrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: Order['status']) => void
  onEdit?: (orderId: string) => void
  onDelete?: (orderId: string) => void
  className?: string
}

export function EnhancedOrderCard({ 
  order, 
  onStatusChange, 
  onEdit, 
  onDelete,
  className 
}: EnhancedOrderCardProps) {
  // ✅ CAMBIO: Mapear status correctamente
  const statusFlow: Record<Order['status'], {
    next: Order['status'] | null;
    action: string | null;
    icon: string | null;
  }> = {
    pending: { next: 'preparing', action: 'Comenzar Preparación', icon: '👨‍🍳' },
    preparing: { next: 'ready', action: 'Marcar Listo', icon: '✅' },
    ready: { next: 'delivered', action: 'Marcar Entregado', icon: '🚚' },
    delivered: { next: null, action: null, icon: null },
    cancelled: { next: null, action: null, icon: null },
  }

  const currentFlow = statusFlow[order.status]
  const canAdvance = currentFlow.next !== null

  const handleStatusChange = () => {
    if (canAdvance && currentFlow.next) {
      const orderId = order.id || order.clientGeneratedId || order.client_generated_id || ''
      onStatusChange(orderId, currentFlow.next)
    }
  }

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage(order)
    const whatsappUrl = `https://wa.me/${order.client_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCopyReceipt = () => {
    const receipt = generateWhatsAppMessage(order)
    navigator.clipboard.writeText(receipt)
    toast.success('Recibo copiado al portapapeles')
  }

  const handleEdit = () => {
    if (onEdit) {
      const orderId = order.id || order.clientGeneratedId || order.client_generated_id || ''
      onEdit(orderId)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      const orderId = order.id || order.clientGeneratedId || order.client_generated_id || ''
      onDelete(orderId)
    }
  }

  return (
    <Card className={cn(
      'hover:shadow-lg transition-all duration-300 border-0 shadow-sm',
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {order.client_name}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {order.client_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order.client_phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
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
            <StatusBadge 
              status={order.status} 
              className="mb-3"
            />
            <p className="text-2xl font-bold text-gray-900">
              ${order.total.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Items */}
        <div className="space-y-3 mb-6">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm font-medium">
                  {item.quantity}x
                </span>
                <span className="text-gray-700">{item.product_name}</span>
              </div>
              <span className="font-semibold text-gray-900">
                ${item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canAdvance && currentFlow.action && (
            <EnhancedButton 
              onClick={handleStatusChange}
              variant="primary"
              className="flex-1 min-w-[160px]"
              icon={<span>{currentFlow.icon}</span>}
            >
              {currentFlow.action}
            </EnhancedButton>
          )}
          
          <EnhancedButton 
            variant="outline" 
            size="sm"
            onClick={handleCopyReceipt}
            icon={<Copy className="w-4 h-4" />}
          >
            Copiar
          </EnhancedButton>
          
          {order.client_phone && (
            <EnhancedButton 
              variant="outline" 
              size="sm"
              onClick={handleShareWhatsApp}
              icon={<Share2 className="w-4 h-4" />}
            >
              WhatsApp
            </EnhancedButton>
          )}

          {onEdit && (
            <EnhancedButton 
              variant="ghost" 
              size="sm"
              onClick={handleEdit}
              icon={<Edit className="w-4 h-4" />}
            >
              Editar
            </EnhancedButton>
          )}

          {onDelete && (
            <EnhancedButton 
              variant="ghost" 
              size="sm"
              onClick={handleDelete}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar
            </EnhancedButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ✅ AÑADIR: Función helper para generar mensaje WhatsApp
function generateWhatsAppMessage(order: Order): string {
  const items = order.items?.map(item => 
    `• ${item.quantity}x ${item.product_name} - $${item.subtotal.toFixed(2)}`
  ).join('\n') || ''

  return `
🧾 *Resumen de Pedido*

👤 *Cliente:* ${order.client_name}
📅 *Fecha:* ${new Date(order.delivery_date).toLocaleDateString('es-ES')}
🎯 *Estado:* ${order.status.toUpperCase()}

📋 *Productos:*
${items}

💰 *Total: $${order.total.toFixed(2)}*

${order.notes ? `📝 *Notas:* ${order.notes}` : ''}
  `.trim()
} 