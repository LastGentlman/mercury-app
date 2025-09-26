/**
 * Account Recovery Dialog Component
 * Shows when a user with a deleted account tries to login
 */

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, RotateCcw, Clock, UserPlus, X } from 'lucide-react'
import { showSuccess, showError } from '../utils/sweetalert'

interface AccountRecoveryDialogProps {
  email: string
  daysRemaining?: number
  canRecover: boolean
  onRecover?: () => void
  onCreateNew?: () => void
  onClose?: () => void
}

export function AccountRecoveryDialog({
  email,
  daysRemaining,
  canRecover,
  onRecover,
  onCreateNew,
  onClose
}: AccountRecoveryDialogProps) {
  const [isRecovering, setIsRecovering] = useState(false)

  const handleRecover = async () => {
    if (!onRecover) return

    setIsRecovering(true)
    try {
      await onRecover()
      showSuccess('¡Cuenta recuperada!', 'Tu cuenta ha sido restaurada exitosamente.')
    } catch (error) {
      console.error('Recovery failed:', error)
      showError('Error de recuperación', 'No se pudo recuperar la cuenta. Intenta de nuevo.')
    } finally {
      setIsRecovering(false)
    }
  }

  if (!canRecover) {
    // Account permanently deleted
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Cuenta Eliminada
            </CardTitle>
            <CardDescription className="text-gray-600">
              Esta cuenta fue eliminada permanentemente y ya no puede ser recuperada.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-sm text-red-600 mt-2">
                El período de gracia ha expirado. Para continuar usando PedidoList,
                necesitas crear una nueva cuenta.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onCreateNew}
                className="w-full"
                size="lg"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Nueva Cuenta
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Account can be recovered
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Recuperar Cuenta
          </CardTitle>
          <CardDescription className="text-gray-600">
            Tu cuenta está marcada para eliminación, pero aún puedes recuperarla.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              <strong>Email:</strong> {email}
            </p>
            {daysRemaining && (
              <p className="text-sm text-yellow-600 mt-2">
                <strong>Tiempo restante:</strong> {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
              </p>
            )}
            <p className="text-sm text-yellow-600 mt-2">
              Si no recuperas tu cuenta, será eliminada permanentemente después del período de gracia.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRecover}
              disabled={isRecovering}
              className="w-full"
              size="lg"
            >
              {isRecovering ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Recuperando...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Recuperar Mi Cuenta
                </>
              )}
            </Button>

            <Button
              onClick={onCreateNew}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Nueva Cuenta
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}