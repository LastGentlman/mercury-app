import { createFileRoute } from '@tanstack/react-router'
import { Paywall } from '../components/Paywall.tsx'
import { useAuth } from '../hooks/useAuth.ts'

function PaywallPage() {
  const { user } = useAuth()

  const businessData = {
    name: 'Mi Negocio',
    email: user?.email || '',
    phone: '',
    address: '',
    currency: 'MXN',
    type: 'restaurant',
    description: ''
  }

  const handleSuccess = (_businessId: string) => {
    window.location.href = '/dashboard'
  }

  const handleClose = () => {
    // Redirigir al setup en lugar del dashboard para evitar loops
    window.location.href = '/setup'
  }

  return (
    <Paywall
      businessData={businessData}
      onSuccess={handleSuccess}
      onClose={handleClose}
    />
  )
}

export const Route = createFileRoute('/paywall')({
  component: PaywallPage,
})
