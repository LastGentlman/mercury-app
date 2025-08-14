import { useState } from 'react'
import { Button } from './ui/button.tsx'
import { CreateProductModal } from './CreateProductModal.tsx'
import { EditProductModal } from './EditProductModal.tsx'
import type { Product } from '../types/index.ts'

export function ProductModalDemo() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [demoProduct] = useState<Product>({
    id: 1,
    businessId: 'demo-business',
    name: 'Hamburguesa Clásica',
    description: 'Deliciosa hamburguesa con carne, lechuga, tomate y queso',
    price: 12.99,
    cost: 8.50,
    category: 'Comida',
    stock: 25,
    isActive: true,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const handleCreateProduct = async (productData: unknown) => {
    console.log('Creating product:', productData)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Product created successfully!')
  }

  const handleEditProduct = async (productData: unknown) => {
    console.log('Updating product:', productData)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Product updated successfully!')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Product Modal Demo</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Create Product Modal</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            Open Create Product Modal
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Test Edit Product Modal</h2>
          <Button onClick={() => setShowEditModal(true)}>
            Open Edit Product Modal
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Demo Product Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(demoProduct, null, 2)}
          </pre>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateProduct}
          isLoading={false}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <EditProductModal
          product={demoProduct}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditProduct}
          isLoading={false}
        />
      )}
    </div>
  )
} 