import { Paywall } from '../components/Paywall.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { useNavigate } from '@tanstack/react-router';

export function PaywallPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock business data - in real app this would come from URL params or context
  const businessData = {
    name: 'Mi Negocio',
    email: user?.email || '',
    phone: '',
    address: '',
    currency: 'MXN',
    type: 'restaurant',
    description: ''
  };

  const handleSuccess = (businessId: string) => {
    // Redirect to dashboard after successful business creation
    navigate({ to: '/dashboard' });
  };

  const handleClose = () => {
    // Go back to dashboard or home
    navigate({ to: '/dashboard' });
  };

  return (
    <Paywall
      businessData={businessData}
      onSuccess={handleSuccess}
      onClose={handleClose}
    />
  );
} 