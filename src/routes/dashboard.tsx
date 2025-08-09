import { createFileRoute } from '@tanstack/react-router'
import { Bell, Store } from 'lucide-react'
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center space-y-8">
            {/* Illustration */}
            <div className="flex items-center justify-center w-40 h-40 mx-auto rounded-full bg-blue-100">
              <Store className="w-24 h-24 text-blue-600" strokeWidth={1.5} />
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-extrabold text-gray-900">
              Configuración Requerida
            </h2>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              Aún no tienes un negocio configurado.
              {"\n"}
              Para comenzar a recibir pedidos y administrar clientes, primero crea o vincula tu negocio.
            </p>

            {/* Action */}
            <button
              onClick={() => {
                // TODO: Reemplazar con flujo real de creación/vinculación de negocio
                alert('Funcionalidad de configuración de negocio en desarrollo');
              }}
              className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
            >
              Configurar Negocio
            </button>
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