/**
 * 🔄 Mobile-First Philosophy:
 * 
 * 1. **Cognitive Load**: Eliminar distracciones en pantallas pequeñas
 * 2. **Focus Flow**: El usuario debe centrarse 100% en la autenticación
 * 3. **Conversion Rate**: Menos elementos = mayor conversión
 * 4. **Touch Targets**: Optimizar para interacción táctil
 * 5. **Visual Hierarchy**: Logo debe ser el único elemento de marca visible
 */

import { Link } from '@tanstack/react-router'
import { Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { useMobileAuth } from '../hooks/useMobileAuth.ts'
import { Button } from './ui/index.ts'

export default function Header() {
  const { user, logout } = useAuth()
  const { shouldHideHeader, isAuthenticated, isLoading } = useMobileAuth()

  // Early return if header should be hidden
  if (shouldHideHeader) {
    return null
  }

  return (
    <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3 md:px-6 md:py-4 lg:py-5">
        <div className="flex justify-center md:justify-between items-center">
          {/* Logo - Centered on mobile, left on desktop */}
          <div className="font-bold text-xl md:text-2xl lg:text-3xl">
            <Link 
              to="/" 
              className="text-slate-800 hover:text-blue-600 transition-colors duration-300"
            >
              Mercury
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-8 lg:space-x-12">
              <Link 
                to="/dashboard" 
                className="font-medium text-slate-700 hover:text-blue-600 transition-colors duration-300 py-2 relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              <Link 
                to="/clients" 
                className="font-medium text-slate-700 hover:text-blue-600 transition-colors duration-300 py-2 relative group"
              >
                Clientes
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              <Link 
                to="/products" 
                className="font-medium text-slate-700 hover:text-blue-600 transition-colors duration-300 py-2 relative group"
              >
                Productos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          )}

          {/* Authentication Section - Hidden on mobile when authenticated */}
          <div className={`items-center space-x-4 ${isAuthenticated ? 'hidden md:flex' : 'flex'}`}>
            {isLoading ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
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
                  className="flex items-center space-x-2"
                >
                  {logout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
