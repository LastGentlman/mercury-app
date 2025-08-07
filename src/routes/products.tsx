import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { ProductsList } from '../components/ProductsList'

export const Route = createFileRoute('/products')({
  component: ProductsPage,
})

function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsList />
    </ProtectedRoute>
  )
}
