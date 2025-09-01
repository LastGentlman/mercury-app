import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useNotifications } from '../hooks/useNotifications.ts'
import { Dashboard } from '../components/Dashboard.tsx'
import { BusinessSetup } from '../components/BusinessSetup.tsx'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const notifications = useNotifications()

  // Si no hay businessId, mostrar la configuración del negocio
  if (!user?.businessId) {
    return (
      <ProtectedRoute>
        <BusinessSetup 
          onBusinessSetup={(_businessId: string) => {
            // En una implementación real, aquí actualizarías el usuario con el businessId
            // Por ahora, simplemente recargamos la página
            notifications.success('Negocio configurado exitosamente. Redirigiendo...');
            setTimeout(() => {
              globalThis.location.reload();
            }, 1000);
          }}
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard businessId={user.businessId} />
        </main>
      </div>
    </ProtectedRoute>
  )
} 