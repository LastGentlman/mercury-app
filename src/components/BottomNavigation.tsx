import { Link, useLocation } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  Users, 
  UserCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'

interface BottomNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

function BottomNavItem({ href, icon, label, isActive }: BottomNavItemProps) {
  return (
    <Link
      to={href}
      className={`flex flex-col items-center min-w-[60px] px-1 py-2 transition-all duration-300 ${
        isActive 
          ? 'text-blue-600' 
          : 'text-gray-500 hover:text-blue-600'
      }`}
    >
      <div className="w-6 h-6 mb-1">
        {icon}
      </div>
      <span className="text-xs font-medium leading-none">
        {label}
      </span>
    </Link>
  )
}

interface BottomCTAProps {
  onClick?: () => void
}

function BottomCTA({ onClick }: BottomCTAProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Visual feedback
    const button = e.currentTarget as HTMLElement
    button.style.transform = 'scale(0.95)'
    setTimeout(() => {
      button.style.transform = 'translateY(-2px)'
    }, 150)
    
    if (onClick) {
      onClick()
    } else {
      console.log('Opening new order creation...')
      // TODO: Implement order creation modal or navigation
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-col items-center justify-center w-14 h-14 -mt-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 relative"
    >
      <Plus className="w-7 h-7" strokeWidth={2.5} />
      <span className="absolute -bottom-6 text-xs font-semibold text-blue-600 whitespace-nowrap">
        Nuevo
      </span>
    </button>
  )
}

export default function BottomNavigation() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Don't show bottom navigation if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const currentPath = location.pathname

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 shadow-lg">
        <div 
          className="flex justify-around items-end px-2 py-3"
          style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
        >
          {/* Dashboard */}
          <BottomNavItem
            href="/dashboard"
            icon={<LayoutDashboard className="w-6 h-6" />}
            label="Dashboard"
            isActive={currentPath === '/dashboard'}
          />

          {/* Orders - For now link to dashboard until orders route exists */}
          <BottomNavItem
            href="/dashboard"
            icon={<ClipboardList className="w-6 h-6" />}
            label="Pedidos"
            isActive={currentPath === '/dashboard' && new URLSearchParams(globalThis.location.search).get('view') === 'orders'}
          />

          {/* CTA - New Order */}
          <BottomCTA />

          {/* Clients */}
          <BottomNavItem
            href="/clients"
            icon={<Users className="w-6 h-6" />}
            label="Clientes"
            isActive={currentPath === '/clients'}
          />

          {/* Profile */}
          <BottomNavItem
            href="/profile"
            icon={<UserCircle className="w-6 h-6" />}
            label="Perfil"
            isActive={currentPath === '/profile'}
          />
        </div>
      </nav>

      {/* Spacer for bottom navigation on mobile */}
      <div className="h-20 md:hidden" />
    </>
  )
} 