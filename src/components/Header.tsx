/**
 * 🔄 Mobile-First Philosophy:
 * 
 * 1. **Cognitive Load**: Eliminar distracciones en pantallas pequeñas
 * 2. **Focus Flow**: El usuario debe centrarse 100% en la autenticación
 * 3. **Conversion Rate**: Menos elementos = mayor conversión
 * 4. **Touch Targets**: Optimizar para interacción táctil
 * 5. **Visual Hierarchy**: Logo debe ser el único elemento de marca visible
 */

import { Link, useLocation } from '@tanstack/react-router'
import { Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { useMobileAuth } from '../hooks/useMobileAuth.ts'
import { Button } from './ui/index.ts'
import { TrialExtensionCompact } from './TrialExtensionBanner.tsx'

export default function Header() {
  const { user, logout } = useAuth()
  const { shouldHideHeader, isAuthenticated, isLoading } = useMobileAuth()
  const location = useLocation()
  
  // Determine button text and route based on current location
  const isOnAuthPage = location.pathname === '/auth'
  const buttonText = isOnAuthPage ? 'Home' : 'Acceso'
  const buttonRoute = isOnAuthPage ? '/' : '/auth'

  // Early return if header should be hidden
  if (shouldHideHeader) {
    return null
  }

  return (
    <>
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-center md:justify-between items-center">
            {/* Logo - Centered on mobile, left on desktop */}
            <div className="text-2xl font-bold tracking-tight">
              <Link 
                to="/" 
                className="text-gray-900 hover:text-gray-700 transition-colors duration-300"
              >
                PedidoList
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/dashboard" 
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 py-2 relative group"
                >
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                
                <Link 
                  to="/clients" 
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 py-2 relative group"
                >
                  Clientes
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                
                <Link 
                  to="/products" 
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 py-2 relative group"
                >
                  Productos
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                
                <Link 
                  to="/profile" 
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 py-2 relative group"
                >
                  Perfil
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>
            )}

            {/* Authentication Section - Hidden on mobile when authenticated */}
            <div className={`items-center space-x-4 ${isAuthenticated ? 'hidden md:flex' : 'flex'}`}>
              {isLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">{user?.name || user?.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {logout.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span className="hidden lg:inline">Salir</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to={buttonRoute}>
                    <Button className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 text-sm">
                      {buttonText}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Trial Extension Compact Banner */}
      <TrialExtensionCompact className="sticky top-16 z-40" />
    </>
  )
}
