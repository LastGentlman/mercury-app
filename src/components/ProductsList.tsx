import { useState } from 'react';
import { Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { useProducts } from '../hooks/useProducts.ts';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Card } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { CreateProductModal } from './CreateProductModal.tsx';
import { EditProductModal } from './EditProductModal.tsx';
import type { Product } from '../types/index.ts';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          {product.category && (
            <Badge variant="secondary" className="mt-1">
              {product.category}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {product.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Precio:</span>
          <span className="font-semibold text-green-600">
            ${product.price.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Stock:</span>
          <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock} unidades
          </span>
        </div>
        
        {product.cost && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Costo:</span>
            <span className="text-sm text-gray-600">
              ${product.cost.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>
    </Card>
  );
}





export function ProductsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { user } = useAuth();
  const {
    products,
    isLoading,
    createProductWithCategory: _createProductWithCategory,
    updateProduct,
    deleteProduct,
    isCreating,
    isDeleting: _isDeleting,
    error: _error,
    isLoading: _isLoadingProducts
  } = useProducts({ businessId: user?.businessId || '' });

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">{products.length} productos registrados</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard 
              key={product.id}
              product={product}
              onEdit={() => setSelectedProduct(product)}
              onDelete={() => product.id && deleteProduct(product.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron productos con ese criterio' : 'Comienza agregando tu primer producto'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (productData) => {
            const fullProductData = {
              ...(productData as Product),
              businessId: user?.businessId || '',
              syncStatus: 'pending' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await _createProductWithCategory(fullProductData as Product & { categoryId: string } & { businessId: string });
          }}
          isLoading={isCreating}
        />
      )}
      
      {selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={async (productData) => {
            const fullProductData = {
              ...(productData as Product),
              businessId: user?.businessId || '',
              syncStatus: 'pending' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await updateProduct(fullProductData as Partial<Product> & { id: number });
          }}
          isLoading={false}
        />
      )}
    </div>
  );
} 