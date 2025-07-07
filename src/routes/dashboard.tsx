import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { Dashboard } from '../components/Dashboard'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const notifications = useNotifications()

  // En una app real, esto vendría del contexto de autenticación
  const businessId = user?.businessId || 'demo-business-id'
  
  // Si no hay businessId, mostrar un mensaje de configuración
  if (!user?.businessId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Configuración Requerida
              </h2>
              <p className="text-gray-600 mb-6">
                Tu cuenta necesita estar asociada a un negocio para continuar.
              </p>
              <button 
                onClick={() => {
                  // Aquí podrías abrir un modal para crear/join business
                  alert('Funcionalidad de configuración de negocio en desarrollo');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Configurar Negocio
              </button>
            </div>
          </div>
        </div>
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