import { createFileRoute } from '@tanstack/react-router'
import { ClientsList } from '@/components/ClientsList'

export const Route = createFileRoute('/clients')({
  component: ClientsPage,
})

function ClientsPage() {
  return <ClientsList />;
} 