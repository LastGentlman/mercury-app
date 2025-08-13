import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { Dashboard } from '../components/Dashboard'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { Button } from '../components/ui/button'
import { BusinessSetup } from '../components/BusinessSetup'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const notifications = useNotifications()

  // En una app real, esto vendría del contexto de autenticación
  const businessId = user?.businessId || 'demo-business-id'
  
  // Si no hay businessId, mostrar la configuración del negocio
  if (!user?.businessId) {
    return (
      <ProtectedRoute>
        <BusinessSetup />
      </ProtectedRoute>
    );
  }
  const isOwner = user.role === 'owner' // Solo los owners reciben notificaciones

  const handleNotificationToggle = () => {
    notifications.info('Funcionalidad de notificaciones push en desarrollo')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">
                  PedidoList
                </h1>
                <ConnectionStatus />
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Botón de notificaciones (solo para owners) */}
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotificationToggle}
                    className="flex items-center space-x-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Activar Notificaciones</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard businessId={businessId} />
        </main>
      </div>
    </ProtectedRoute>
  )
} 