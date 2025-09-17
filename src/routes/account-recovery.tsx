/**
 * Account Recovery Page
 * 
 * Allows users to cancel account deletion during the grace period
 * Shows countdown timer and provides cancellation option
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import { AccountDeletionService, type DeletionLog } from '../services/account-deletion-service.ts'
import { useAuth } from '../hooks/useAuth.ts'

interface AccountRecoverySearch {
  'deletion-id'?: string
}

export default function AccountRecoveryPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/account-recovery' }) as AccountRecoverySearch
  const { user, logout } = useAuth()
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  // Get deletion log details
  const { data: deletionLog, isLoading: isLoadingLog, error: logError } = useQuery({
    queryKey: ['deletion-log', search['deletion-id']],
    queryFn: async (): Promise<DeletionLog | null> => {
      if (!search['deletion-id']) return null
      return await AccountDeletionService.getDeletionLog(search['deletion-id'])
    },
    enabled: !!search['deletion-id']
  })

  // Cancel deletion mutation
  const cancelDeletion = useMutation({
    mutationFn: async (deletionLogId: string) => {
      await AccountDeletionService.cancelAccountDeletion(deletionLogId)
    },
    onSuccess: () => {
      // Redirect to dashboard after successful cancellation
      navigate({ to: '/dashboard', replace: true })
    },
    onError: (error) => {
      console.error('Error cancelling deletion:', error)
      alert('Error al cancelar la eliminación. Contacta soporte@pedidolist.com')
    }
  })

  // Update countdown timer
  useEffect(() => {
    if (!deletionLog) return

    const updateTimer = () => {
      const gracePeriodEnd = new Date(deletionLog.grace_period_end)
      const now = new Date()
      const timeDiff = gracePeriodEnd.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeLeft('Expirado')
        setIsExpired(true)
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft(`${days} días y ${hours} horas`)
      } else if (hours > 0) {
        setTimeLeft(`${hours} horas y ${minutes} minutos`)
      } else {
        setTimeLeft(`${minutes} minutos`)
      }
    }

    // Update immediately
    updateTimer()

    // Update every minute
    const interval = setInterval(updateTimer, 60000)

    return () => clearInterval(interval)
  }, [deletionLog])

  // Handle cancel deletion
  const handleCancelDeletion = async () => {
    if (!deletionLog || isExpired) return

    const confirmed = window.confirm(
      '¿Estás seguro de que quieres cancelar la eliminación de tu cuenta? ' +
      'Tu cuenta será restaurada inmediatamente.'
    )

    if (confirmed) {
      cancelDeletion.mutate(deletionLog.id)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await logout.mutateAsync()
  }

  // Loading state
  if (isLoadingLog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de eliminación...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (logError || !deletionLog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar información
          </h2>
          <p className="text-gray-600 mb-6">
            No se pudo cargar la información de eliminación de cuenta.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Ir al Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check if deletion is already processed
  if (deletionLog.status !== 'pending') {
    const isCompleted = deletionLog.status === 'completed'
    const isCancelled = deletionLog.status === 'cancelled'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          {isCompleted ? (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cuenta Eliminada
              </h2>
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido eliminada permanentemente el{' '}
                {new Date(deletionLog.completed_at!).toLocaleDateString()}.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Eliminación Cancelada
              </h2>
              <p className="text-gray-600 mb-6">
                La eliminación de tu cuenta fue cancelada el{' '}
                {new Date(deletionLog.cancelled_at!).toLocaleDateString()}.
              </p>
            </>
          )}
          
          <div className="space-y-3">
            {isCancelled ? (
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Ir al Dashboard
              </button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Si crees que esto es un error, contacta:
                </p>
                <a
                  href="mailto:soporte@pedidolist.com"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  soporte@pedidolist.com
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cuenta Programada para Eliminación
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Tiempo Restante</span>
            </div>
            <p className="text-yellow-800 text-lg font-bold">
              {timeLeft}
            </p>
          </div>

          <div className="text-left mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Detalles de la eliminación:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Fecha de solicitud:</strong> {new Date(deletionLog.created_at).toLocaleDateString()}</li>
              <li><strong>Razón:</strong> {deletionLog.deletion_reason}</li>
              <li><strong>Período de gracia:</strong> 90 días</li>
              <li><strong>Fecha límite:</strong> {new Date(deletionLog.grace_period_end).toLocaleDateString()}</li>
            </ul>
          </div>

          <div className="space-y-4">
            {!isExpired ? (
              <button
                onClick={handleCancelDeletion}
                disabled={cancelDeletion.isPending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {cancelDeletion.isPending ? 'Cancelando...' : 'Cancelar Eliminación'}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">
                  El período de gracia ha expirado. Tu cuenta será eliminada automáticamente.
                </p>
              </div>
            )}

            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Continuar al Dashboard
            </button>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                ¿Necesitas ayuda?
              </p>
              <a
                href="mailto:soporte@pedidolist.com"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                soporte@pedidolist.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
