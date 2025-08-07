import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { ClientsList } from '@/components/ClientsList'

export const Route = createFileRoute('/clients')({
  component: ClientsPage,
})

function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsList />
    </ProtectedRoute>
  )
} 