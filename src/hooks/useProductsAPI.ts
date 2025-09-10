import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './useAuth.ts';
import { useCSRFRequest } from './useCSRF.ts';

// ===== API FUNCTIONS =====

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.pedidolist.com';

// ===== MAIN HOOK =====

export function useProductsAPI() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { csrfRequest } = useCSRFRequest();

  // Get products
  const productsQuery = useQuery({
    queryKey: ['products-api', user?.businessId],
    queryFn: async () => {
      if (!user?.businessId) {
        throw new Error('Business ID is required');
      }
      
      const response = await csrfRequest(`${BACKEND_URL}/api/products/${user.businessId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching products');
      }
      const data = await response.json();
      return data.products || [];
    },
    enabled: !!user?.businessId && !!user?.id
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: async (product: {
      name: string;
      price: number;
      category?: string;
      description?: string;
    }) => {
      if (!user?.businessId) {
        throw new Error('Business ID is required');
      }

      const response = await csrfRequest(`${BACKEND_URL}/api/products/${user.businessId}`, {
        method: 'POST',
        body: JSON.stringify(product)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-api'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear producto: ${error.message}`);
    }
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...product }: { id: string; name?: string; price?: number; category?: string; description?: string }) => {
      if (!user?.businessId) {
        throw new Error('Business ID is required');
      }

      const response = await csrfRequest(`${BACKEND_URL}/api/products/${user.businessId}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(product)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-api'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar producto: ${error.message}`);
    }
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.businessId) {
        throw new Error('Business ID is required');
      }

      const response = await csrfRequest(`${BACKEND_URL}/api/products/${user.businessId}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-api'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar producto: ${error.message}`);
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    
    // Mutations
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Refetch function
    refetch: productsQuery.refetch,
  };
}
