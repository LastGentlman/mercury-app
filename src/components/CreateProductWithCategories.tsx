import React, { useState } from 'react';
import { useBusinessCategories } from '../hooks/useBusinessCategories.ts';
import { AlertCircle, Save, Package, Plus, Tag } from 'lucide-react';
import { Button } from './ui/index.ts';
import { Input } from './ui/index.ts';
import { Label } from './ui/index.ts';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/offline/db.ts';

interface CreateProductWithCategoriesProps {
  businessId: string;
  onClose: () => void;
  onProductCreated?: () => void;
}

export function CreateProductWithCategories({ 
  businessId, 
  onClose,
  onProductCreated
}: CreateProductWithCategoriesProps) {
  const { categories, isLoading: loadingCategories, createCustomCategory } = useBusinessCategories(businessId);
  
  const [product, setProduct] = useState({
    name: '',
    price: 0,
    categoryId: '',
    description: '',
    cost: 0,
    stock: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState({
    categoryId: '',
    categoryName: '',
    icon: '📦',
    satCode: '50000000'
  });

  const selectedCategory = categories.find(cat => cat.categoryId === product.categoryId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!product.name.trim()) newErrors.name = 'El nombre es requerido';
    if (product.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (!product.categoryId) newErrors.categoryId = 'Selecciona una categoría';
    if (product.stock < 0) newErrors.stock = 'El stock no puede ser negativo';
    if (product.cost < 0) newErrors.cost = 'El costo no puede ser negativo';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsCreating(true);
    try {
      // Get category information for SAT code
      const category = categories.find(cat => cat.categoryId === product.categoryId);
      
      const clientGeneratedId = uuidv4();
      const productData = {
        ...product,
        businessId,
        satCode: category?.satCode || '50000000',
        taxRate: 0.16,
        isActive: true,
        clientGeneratedId,
        syncStatus: 'pending' as const,
        lastModifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.products.add(productData);

      // Add to sync queue
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: clientGeneratedId,
        action: 'create'
      });

      toast.success('Producto creado exitosamente');
      onProductCreated?.();
      onClose();
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear producto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCustomCategory = async () => {
    if (!customCategory.categoryName.trim() || !customCategory.categoryId.trim()) {
      toast.error('Por favor completa todos los campos de la categoría');
      return;
    }

    try {
      await createCustomCategory.mutateAsync(customCategory);
      setProduct(prev => ({ ...prev, categoryId: customCategory.categoryId }));
      setShowCustomCategory(false);
      setCustomCategory({
        categoryId: '',
        categoryName: '',
        icon: '📦',
        satCode: '50000000'
      });
    } catch (error) {
      console.error('Error al crear categoría personalizada:', error);
    }
  };

  const updateField = (field: keyof typeof product, value: string | number | boolean) => {
    setProduct(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPrice = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    return numericValue;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Crear Nuevo Producto
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Producto */}
          <div>
            <Label htmlFor="product-name" className="text-sm font-medium text-gray-700 mb-2">
              Nombre del Producto *
            </Label>
            <Input
              id="product-name"
              type="text"
              value={product.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Cappuccino Grande"
              className={errors.name ? 'border-red-300 bg-red-50' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Precio */}
          <div>
            <Label htmlFor="product-price" className="text-sm font-medium text-gray-700 mb-2">
              Precio de Venta * (MXN)
            </Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              value={product.price || ''}
              onChange={(e) => updateField('price', formatPrice(e.target.value))}
              placeholder="0.00"
              className={errors.price ? 'border-red-300 bg-red-50' : ''}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.price}
              </p>
            )}
          </div>

          {/* Costo */}
          <div>
            <Label htmlFor="product-cost" className="text-sm font-medium text-gray-700 mb-2">
              Costo (MXN)
            </Label>
            <Input
              id="product-cost"
              type="number"
              step="0.01"
              min="0"
              value={product.cost || ''}
              onChange={(e) => updateField('cost', formatPrice(e.target.value))}
              placeholder="0.00"
            />
            {errors.cost && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cost}
              </p>
            )}
          </div>

          {/* Stock */}
          <div>
            <Label htmlFor="product-stock" className="text-sm font-medium text-gray-700 mb-2">
              Stock Inicial
            </Label>
            <Input
              id="product-stock"
              type="number"
              min="0"
              value={product.stock || ''}
              onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.stock}
              </p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="product-description" className="text-sm font-medium text-gray-700 mb-2">
            Descripción
          </Label>
          <textarea
            id="product-description"
            value={product.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descripción detallada del producto..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Selector de Categorías */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-gray-700">
              Categoría *
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomCategory(!showCustomCategory)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear Categoría
            </Button>
          </div>

          {/* Categoría Personalizada */}
          {showCustomCategory && (
            <div className="p-4 bg-blue-50 rounded-lg mb-4 space-y-3">
              <h4 className="font-medium text-blue-900">Crear Nueva Categoría</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="ID de categoría (ej: nueva-categoria)"
                  value={customCategory.categoryId}
                  onChange={(e) => setCustomCategory(prev => ({ 
                    ...prev, 
                    categoryId: e.target.value.toLowerCase().replace(/\s+/g, '-')
                  }))}
                />
                <Input
                  placeholder="Nombre de la categoría"
                  value={customCategory.categoryName}
                  onChange={(e) => setCustomCategory(prev => ({ ...prev, categoryName: e.target.value }))}
                />
                <Input
                  placeholder="Emoji (ej: 📦)"
                  value={customCategory.icon}
                  onChange={(e) => setCustomCategory(prev => ({ ...prev, icon: e.target.value }))}
                />
                <Input
                  placeholder="Código SAT"
                  value={customCategory.satCode}
                  onChange={(e) => setCustomCategory(prev => ({ ...prev, satCode: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCustomCategory}
                  disabled={createCustomCategory.isPending}
                >
                  {createCustomCategory.isPending ? 'Creando...' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomCategory(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Categorías Existentes */}
          {loadingCategories ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando categorías...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.categoryId}
                  type="button"
                  onClick={() => updateField('categoryId', category.categoryId)}
                  className={`p-4 border-2 rounded-lg transition-all text-left hover:shadow-md ${
                    product.categoryId === category.categoryId
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2 text-center">{category.icon}</div>
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {category.categoryName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    SAT: {category.satCode}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.categoryId}
            </p>
          )}
        </div>

        {/* Información de la Categoría Seleccionada */}
        {selectedCategory && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Información Fiscal</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Categoría:</span>
                <p className="text-green-700">{selectedCategory.categoryName}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Código SAT:</span>
                <p className="text-green-700 font-mono">{selectedCategory.satCode}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">IVA:</span>
                <p className="text-green-700">16% (General)</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isCreating || loadingCategories}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            className="px-6"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
} 