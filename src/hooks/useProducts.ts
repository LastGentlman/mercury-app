import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './useAuth.ts';
import { useBusinessCategories } from './useBusinessCategories.ts';
import { db } from '../lib/offline/db.ts';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../types/index.ts';

export function useProducts({ businessId }: { businessId: string }) {
  const { user: _user } = useAuth();
  const { categories } = useBusinessCategories(businessId);
  const queryClient = useQueryClient();

  // Fetch products from IndexedDB (offline-first)
  const productsQuery = useQuery({
    queryKey: ['products', businessId],
    queryFn: async () => {
      return await db.getProductsWithCategories(businessId);
    },
    enabled: !!businessId
  });

  // Create product with category
  const createProductWithCategory = useMutation({
    mutationFn: async (productData: {
      name: string;
      price: number;
      categoryId: string;
      description?: string;
      cost?: number;
      stock?: number;
    }) => {
      // Get category information for SAT code
      const category = categories.find(cat => cat.categoryId === productData.categoryId);
      
      const clientGeneratedId = uuidv4();
      const product: Omit<Product, 'id'> = {
        ...productData,
        businessId,
        satCode: category?.satCode || '50000000',
        taxRate: 0.16,
        stock: productData.stock || 0,
        isActive: true,
        clientGeneratedId,
        syncStatus: 'pending',
        lastModifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to IndexedDB
      const id = await db.products.add(product);

      // Add to sync queue
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: clientGeneratedId,
        action: 'create'
      });

      return { ...product, id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear producto');
    }
  });

  // Update product (offline-first)
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Product> & { id: number }) => {
      await db.products.update(id, {
        ...updateData,
        lastModifiedAt: new Date().toISOString(),
        syncStatus: 'pending'
      });
      
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: id.toString(),
        action: 'update'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error al actualizar producto:', error);
      toast.error('Error al actualizar producto');
    }
  });

  // Delete product (offline-first)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await db.products.update(id, {
        isActive: false,
        lastModifiedAt: new Date().toISOString(),
        syncStatus: 'pending'
      });
      
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: id.toString(),
        action: 'update'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar producto');
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProductWithCategory: createProductWithCategory.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createProductWithCategory.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}