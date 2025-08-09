import { Plus, LayoutDashboard, ClipboardList, Users, UserCircle } from 'lucide-react'
import { Button } from './ui/button'

interface BusinessSetupRequiredProps {
  onConfigureBusiness: () => void
}

export function BusinessSetupRequired({ onConfigureBusiness }: BusinessSetupRequiredProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Mercury</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Store Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Configuración Requerida
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Aún no tienes un negocio configurado. Para comenzar a recibir pedidos y administrar clientes, primero crea o vincula tu negocio.
          </p>

          {/* Configure Business Button */}
          <Button
            onClick={onConfigureBusiness}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
            size="lg"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <span>Configurar Negocio</span>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex flex-col items-center space-y-1">
            <LayoutDashboard className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-600">Dashboard</span>
          </div>
          
          <div className="flex flex-col items-center space-y-1">
            <ClipboardList className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-600">Pedidos</span>
          </div>
          
          <div className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-1">
            <Users className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-600">Clientes</span>
          </div>
          
          <div className="flex flex-col items-center space-y-1">
            <UserCircle className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-600">Perfil</span>
          </div>
        </div>
      </nav>
    </div>
  )
}