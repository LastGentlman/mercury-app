import React from 'react';
import { LayoutDashboard, ClipboardList, Users, User, Plus } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '../lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Pedidos',
    href: '/orders',
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'Clientes',
    href: '/customers',
  },
  {
    icon: <User className="w-5 h-5" />,
    label: 'Perfil',
    href: '/profile',
  },
];

export function MobileNav() {
  const location = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <nav className="grid grid-cols-5 h-16">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs transition-colors",
              location.pathname === item.href
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
        
        {/* Central Add Button */}
        <div className="flex items-center justify-center">
          <button
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // Implement add functionality
              console.log('Add button clicked');
            }}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs transition-colors",
              location.pathname === item.href
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}