import { createFileRoute } from '@tanstack/react-router'
import { ProductsList } from '../components/ProductsList'

export const Route = createFileRoute('/products')({
  component: ProductsPage,
})

function ProductsPage() {
  return <ProductsList />
}
