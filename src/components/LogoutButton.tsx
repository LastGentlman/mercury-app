import { LogOut } from 'lucide-react';
import { Button } from './ui/button.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { useNotifications } from '../hooks/useNotifications.ts';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export function LogoutButton({ 
  variant = 'outline', 
  size = 'sm', 
  showText = true,
  className 
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const notifications = useNotifications();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      notifications.success('Sesión cerrada exitosamente');
    } catch (_error) {
      notifications.error('Error al cerrar sesión');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={logout.isPending}
      className={className}
    >
      <LogOut className="w-4 h-4" />
      {showText && <span className="ml-2">Cerrar Sesión</span>}
    </Button>
  );
} 