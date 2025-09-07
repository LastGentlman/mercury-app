import { Link, createFileRoute } from '@tanstack/react-router'
import { Loader2, Smartphone, Globe } from 'lucide-react'
import { usePWARouteStrategy, PWARouteConfigs } from '../hooks/usePWARouteStrategy'
import { Button } from '../components/ui/index.ts'
import MinimalistLanding from '../components/MinimalistLanding'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  // ✅ Usar la versión mejorada con configuración de entorno
  const pwaRoute = usePWARouteStrategy(
    import.meta.env.DEV 
      ? PWARouteConfigs.development 
      : PWARouteConfigs.production
  )

  const {
    isPWA,
    isAuthenticated,
    isLoading,
    launchSource,
    hasInitialized,
    debugInfo
  } = pwaRoute

  // ✅ Loading mejorado con contexto
  if (isLoading || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              Cargando PedidoList App...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isPWA ? '📱 Modo PWA detectado' : '🌐 Versión web'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Vista para usuarios autenticados
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            
            {/* Header con indicador de PWA */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {isPWA ? (
                <Smartphone className="h-6 w-6 text-gray-600" />
              ) : (
                <Globe className="h-6 w-6 text-gray-600" />
              )}
              <h1 className="text-4xl font-bold text-gray-900">
                ¡Bienvenido de vuelta!
              </h1>
            </div>

            <p className="text-xl text-gray-600 mb-8">
              Tu aplicación PedidoList está lista para usar
              {isPWA && (
                <span className="block text-sm text-gray-500 mt-2 font-medium">
                  ✨ Ejecutándose como aplicación nativa
                </span>
              )}
            </p>

            {/* Acciones principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 w-full sm:w-auto">
                  Ir al Dashboard
                </Button>
              </Link>
              
              <Link to="/clients">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Ver Clientes
                </Button>
              </Link>
            </div>

            {/* Stats rápidas o accesos directos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Órdenes Hoy</h3>
                <p className="text-2xl font-bold text-gray-600">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Pendientes</h3>
                <p className="text-2xl font-bold text-gray-600">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Completadas</h3>
                <p className="text-2xl font-bold text-gray-600">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info en desarrollo */}
        {debugInfo && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs">
            <div className="font-bold mb-1">🔧 Debug PWA</div>
            <div>Source: {launchSource}</div>
            <div>Redirects: {debugInfo.redirectAttempts}/{debugInfo.maxAttempts}</div>
            <div>Path: {debugInfo.location}</div>
          </div>
        )}
      </div>
    )
  }

  // ✅ Landing page para usuarios no autenticados (solo en navegador)
  // Los usuarios PWA ya fueron redirigidos a /auth
  return (
    <MinimalistLanding 
      isPWA={isPWA}
      isAuthenticated={isAuthenticated}
      debugInfo={debugInfo}
    />
  )
}
