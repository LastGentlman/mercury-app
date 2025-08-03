import { Link } from '@tanstack/react-router'
import { Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  return (
    <header className="p-4 flex gap-4 bg-white text-black justify-between items-center border-b border-gray-200">
      <nav className="flex flex-row items-center space-x-6">
        <div className="px-2 font-bold text-lg">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            PedidoList
          </Link>
        </div>

        {isAuthenticated && (
          <>
            <div className="px-2 font-medium">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
            </div>

            <div className="px-2 font-medium">
              <Link to="/clients" className="hover:text-blue-600 transition-colors">
                Clientes
              </Link>
            </div>

          </>
        )}

      </nav>

      {/* Authentication Section */}
      <div className="flex items-center space-x-4">
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.name || user?.email}</span>
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
              <span>Logout</span>
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
    </header>
  )
}
