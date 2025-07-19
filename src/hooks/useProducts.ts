import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import { useAuth } from './useAuth';
import type { Product } from '@/types';


// ===== TYPES =====



// ===== API FUNCTIONS =====

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';



// ===== MAIN HOOK =====

export function useProducts() {
  const { user } = useAuth();
  const { addPendingChange } = useOfflineSync();
  const queryClient = useQueryClient();

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ['products', user?.businessId],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Error fetching products');
      return response.json();
    },
    enabled: !!user?.businessId
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error('Error creating product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (_error: Error, product: Omit<Product, 'id' | 'created_at'>) => {
      // Add to offline sync if failed
      addPendingChange({
        type: 'create',
        data: product
      });
      toast.error('Error al crear producto. Se guardará cuando esté en línea.');
    }
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error('Error updating product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (_error: Error, variables: Partial<Product> & { id: string }) => {
      const { id, ...productData } = variables;
      addPendingChange({
        type: 'update',
        data: { id, ...productData }
      });
      toast.error('Error al actualizar producto. Se guardará cuando esté en línea.');
    }
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Error deleting product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (_error: Error, id: string) => {
      addPendingChange({
        type: 'delete',
        data: { id }
      });
      toast.error('Error al eliminar producto. Se eliminará cuando esté en línea.');
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}