import { useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { Button } from './ui/index.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/index.ts'
import type { ConflictInfo } from '../lib/offline/conflictResolver.ts'

interface ConflictResolverProps {
  conflict: ConflictInfo
  onResolve: (winner: 'local' | 'server' | 'merge') => void
  onDismiss: () => void
}

export function ConflictResolver({ conflict, onResolve, onDismiss }: ConflictResolverProps) {
  const [isResolving, setIsResolving] = useState(false)

  const handleResolve = async (winner: 'local' | 'server' | 'merge') => {
    setIsResolving(true)
    try {
      await onResolve(winner)
    } finally {
      setIsResolving(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getEntityTitle = () => {
    if (conflict.entityType === 'order') {
      const order = conflict.localVersion as unknown as { clientGeneratedId: string; clientName: string }
      return `Pedido #${order.clientGeneratedId} - ${order.clientName}`
    } else {
      const product = conflict.localVersion as unknown as { name: string }
      return `Producto: ${product.name}`
    }
  }

  const renderEntityDetails = (entity: unknown, title: string) => {
    if (conflict.entityType === 'order') {
      const order = entity as { clientName: string; status: string; total: number; deliveryDate: string; lastModifiedAt?: string; updatedAt?: string; notes?: string }
      return (
        <div className="space-y-2">
          <h4 className="font-medium">{title}</h4>
          <div className="text-sm space-y-1">
            <p><strong>Cliente:</strong> {order.clientName}</p>
            <p><strong>Estado:</strong> {order.status}</p>
            <p><strong>Total:</strong> ${order.total}</p>
            <p><strong>Fecha:</strong> {formatTimestamp(order.deliveryDate)}</p>
            <p><strong>Modificado:</strong> {formatTimestamp(order.lastModifiedAt || order.updatedAt || '')}</p>
            {order.notes && <p><strong>Notas:</strong> {order.notes}</p>}
          </div>
        </div>
      )
    } else {
      const product = entity as { name: string; price: number; category?: string; lastModifiedAt?: string; updatedAt?: string; description?: string }
      return (
        <div className="space-y-2">
          <h4 className="font-medium">{title}</h4>
          <div className="text-sm space-y-1">
            <p><strong>Nombre:</strong> {product.name}</p>
            <p><strong>Precio:</strong> ${product.price}</p>
            <p><strong>Categoría:</strong> {product.category || 'Sin categoría'}</p>
            <p><strong>Modificado:</strong> {formatTimestamp(product.lastModifiedAt || product.updatedAt || '')}</p>
            {product.description && <p><strong>Descripción:</strong> {product.description}</p>}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflicto de Sincronización
          </CardTitle>
          <CardDescription>
            Se detectó un conflicto en {getEntityTitle()}. 
            Elige qué versión mantener o fusiona los datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Versión Local */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
            {renderEntityDetails(conflict.localVersion, 'Versión Local')}
          </div>

          {/* Versión del Servidor */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            {renderEntityDetails(conflict.serverVersion, 'Versión del Servidor')}
          </div>

          {/* Opciones de Resolución */}
          <div className="space-y-3">
            <h4 className="font-medium">¿Qué versión quieres mantener?</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleResolve('local')}
                disabled={isResolving}
                variant="outline"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mantener Local
              </Button>
              <Button
                onClick={() => handleResolve('server')}
                disabled={isResolving}
                variant="outline"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Usar Servidor
              </Button>
              <Button
                onClick={() => handleResolve('merge')}
                disabled={isResolving}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Fusionar Datos
              </Button>
            </div>
          </div>

          {/* Botón Cancelar */}
          <div className="flex justify-end">
            <Button
              onClick={onDismiss}
              disabled={isResolving}
              variant="ghost"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 