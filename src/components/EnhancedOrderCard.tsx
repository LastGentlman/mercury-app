
import { 
  Clock, 
  Copy,
  Edit,
  MapPin, 
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
  const statusFlow = {
    pending: { next: 'in_progress', action: 'Comenzar Preparación', icon: '👨‍🍳' },
    in_progress: { next: 'completed', action: 'Marcar Listo', icon: '✅' },
    completed: { next: null, action: null, icon: null },
    cancelled: { next: null, action: null, icon: null },
  }

  const currentFlow = statusFlow[order.status]
  const canAdvance = currentFlow.next !== null

  const handleStatusChange = () => {
    if (canAdvance) {
      const orderId = order.id?.toString() || order.clientGeneratedId
      onStatusChange(orderId, currentFlow.next as Order['status'])
    }
  }

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage(order)
    const whatsappUrl = `https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCopyReceipt = () => {
    const receipt = generateWhatsAppMessage(order)
    navigator.clipboard.writeText(receipt)
    toast.success('Recibo copiado al portapapeles')
  }

  const handleEdit = () => {
    if (onEdit) {
      const orderId = order.id?.toString() || order.clientGeneratedId
      onEdit(orderId)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      const orderId = order.id?.toString() || order.clientGeneratedId
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
              {order.clientName}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {order.clientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order.clientPhone}</span>
                </div>
              )}
              {order.clientAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="max-w-xs truncate">{order.clientAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  {order.deliveryDate ? 
                    new Date(order.deliveryDate).toLocaleDateString('es-ES') : 
                    'Sin fecha específica'
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge 
              status={order.status === 'in_progress' ? 'preparing' : 
                     order.status === 'completed' ? 'ready' : 
                     order.status === 'cancelled' ? 'cancelled' : 'pending'} 
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
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm font-medium">
                  {item.quantity}x
                </span>
                <span className="text-gray-700">{item.productName}</span>
              </div>
              <span className="font-semibold text-gray-900">
                ${item.total.toFixed(2)}
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
          {canAdvance && (
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
          
          {order.clientPhone && (
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
              variant="danger" 
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

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(order: Order): string {
  const items = order.items.map(item => 
    `${item.quantity}x ${item.productName} - $${item.total.toFixed(2)}`
  ).join('\n')

  return `🧾 *Pedido Confirmado*
📅 Fecha: ${new Date(order.deliveryDate).toLocaleDateString('es-ES')}

📋 *Detalle:*
${items}

💰 *Total: $${order.total.toFixed(2)}*

${order.notes ? `📝 *Notas:* ${order.notes}` : ''}

¡Gracias por tu pedido! 🙏`
} 