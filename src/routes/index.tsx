import { Link, createFileRoute } from '@tanstack/react-router'
import { Loader2, Smartphone, Globe } from 'lucide-react'
import { usePWARouteStrategy, PWARouteConfigs } from '../hooks/usePWARouteStrategy'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              Cargando Mercury App...
            </p>
            <p className="text-sm text-gray-600 mt-1">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            
            {/* Header con indicador de PWA */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {isPWA ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : (
                <Globe className="h-6 w-6 text-gray-600" />
              )}
              <h1 className="text-4xl font-bold text-gray-900">
                ¡Bienvenido de vuelta!
              </h1>
            </div>

            <p className="text-xl text-gray-600 mb-8">
              Tu aplicación Mercury está lista para usar
              {isPWA && (
                <span className="block text-sm text-blue-600 mt-2 font-medium">
                  ✨ Ejecutándose como aplicación nativa
                </span>
              )}
            </p>

            {/* Acciones principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Ir al Dashboard
                </Button>
              </Link>
              
              <Link to="/clients">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                >
                  Ver Clientes
                </Button>
              </Link>
            </div>

            {/* Stats rápidas o accesos directos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <h3 className="font-semibold text-gray-900">Órdenes Hoy</h3>
                <p className="text-2xl font-bold text-blue-600">-</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <h3 className="font-semibold text-gray-900">Pendientes</h3>
                <p className="text-2xl font-bold text-orange-600">-</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <h3 className="font-semibold text-gray-900">Completadas</h3>
                <p className="text-2xl font-bold text-green-600">-</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Mercury App
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Una Progressive Web App moderna construida con React, TanStack Router, 
              y capacidades offline avanzadas para gestión de órdenes.
            </p>
            
            {/* CTAs principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                  Comenzar Ahora
                </Button>
              </Link>
              
              <Link to="/design-system">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 text-lg px-8 py-3"
                >
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Progressive Web App
              </h3>
              <p className="text-gray-600">
                Instala como app nativa en cualquier dispositivo. 
                Funciona offline y sincroniza automáticamente.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acceso Universal
              </h3>
              <p className="text-gray-600">
                Funciona en cualquier navegador moderno. 
                No requiere instalación desde app stores.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sincronización Inteligente
              </h3>
              <p className="text-gray-600">
                Trabaja offline y sincroniza cuando vuelva la conexión. 
                Nunca pierdas datos importantes.
              </p>
            </div>
          </div>

          {/* Social Proof / Trust Indicators */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Utilizado por equipos de trabajo en todo el mundo
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              {/* Aquí podrías agregar logos de clientes o métricas */}
              <span className="text-sm font-medium">✅ Seguro</span>
              <span className="text-sm font-medium">⚡ Rápido</span>
              <span className="text-sm font-medium">📱 Nativo</span>
            </div>
          </div>
        </div>

        {/* Debug info en desarrollo */}
        {debugInfo && (
          <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg">
            <div className="font-bold mb-1">🔧 Debug Mode</div>
            <div>Launch: {launchSource}</div>
            <div>PWA: {isPWA ? 'Yes' : 'No'}</div>
            <div>Auth: {isAuthenticated ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
