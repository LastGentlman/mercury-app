import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCSRFRequest } from './useCSRF';
import { useOfflineSync } from './useOfflineSync';
import type { Product } from '@/types';
import { db } from '@/lib/offline/db';

// ===== TYPES =====

interface ProductsResponse {
  products: Array<Product>;
  count: number;
  businessId: string;
}

interface CreateProductRequest {
  name: string;
  price: number;
  category?: string;
  description?: string;
}

interface UpdateProductRequest {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  isActive?: boolean;
}

interface UseProductsOptions {
  businessId?: string;
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  gcTime?: number;
}

interface UseProductsReturn {
  // Data
  products: Array<Product>;
  allProducts: Array<Product>;
  categories: Array<string>;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  
  // Error handling
  error: Error | null;
  
  // Actions
  refetch: () => Promise<any>;
  createProduct: (data: CreateProductRequest) => Promise<Product>;
  updateProduct: (id: string, data: UpdateProductRequest) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Mutations state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// ===== API FUNCTIONS =====

const productsApi = {
  async fetchProducts(businessId: string): Promise<ProductsResponse> {
    const response = await fetch(`/api/products/${businessId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async createProduct(businessId: string, data: CreateProductRequest): Promise<Product> {
    const response = await fetch(`/api/products/${businessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.product;
  },

  async updateProduct(businessId: string, productId: string, data: UpdateProductRequest): Promise<Product> {
    const response = await fetch(`/api/products/${businessId}/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.product;
  },

  async deleteProduct(businessId: string, productId: string): Promise<void> {
    const response = await fetch(`/api/products/${businessId}/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  },
};

// ===== UTILITY FUNCTIONS =====

function mergeProducts(localProducts: Array<Product>, serverProducts: Array<Product>): Array<Product> {
  const merged = new Map<string, Product>();
  
  // Add server products first
  serverProducts.forEach(product => {
    const key = product.id?.toString() || product.name;
    merged.set(key, product);
  });
  
  // Override with local products (priority to unsynced local changes)
  localProducts.forEach(product => {
    const key = product.id?.toString() || product.name;
    if (product.syncStatus === 'pending') {
      merged.set(key, product);
    }
  });
  
  return Array.from(merged.values());
}

function extractCategories(products: Array<Product>): Array<string> {
  const categories = new Set<string>();
  products.forEach(product => {
    if (product.category) {
      categories.add(product.category);
    }
  });
  return Array.from(categories).sort();
}

// ===== MAIN HOOK =====

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    businessId,
    enabled = true,
    refetchInterval = 60000, // 1 minute
    staleTime = 10 * 60 * 1000, // 10 minutes
    gcTime = 30 * 60 * 1000, // 30 minutes
  } = options;

  const { isOnline } = useOfflineSync();
  const { csrfRequest } = useCSRFRequest();
  const queryClient = useQueryClient();

  // ===== QUERY =====
  
  const {
    data: productsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', businessId],
    queryFn: async (): Promise<Array<Product>> => {
      if (!businessId) return [];

      try {
        // Get from IndexedDB first
        const localProducts = await db.getProductsByBusiness(businessId);
        
        // If online, try to sync with server
        if (isOnline) {
          try {
            const response = await csrfRequest(`/api/products/${businessId}`);
            if (response.ok) {
              const serverData: ProductsResponse = await response.json();
              const serverProducts = serverData.products;
              
              // Merge local and server data
              const mergedProducts = mergeProducts(localProducts, serverProducts);
              
              // Update local database with server data
              await Promise.all(
                serverProducts.map(product => 
                  db.products.put(product).catch(() => {}) // Ignore errors
                )
              );
              
              return mergedProducts;
            }
          } catch (serverError) {
            console.warn('Failed to sync with server, using local data:', serverError);
          }
        }
        
        // Return local products (filtered to active only)
        return localProducts.filter(product => product.isActive);
      } catch (err) {
        console.error('Error fetching products:', err);
        throw err;
      }
    },
    enabled: enabled && !!businessId,
    refetchInterval: isOnline ? refetchInterval : false,
    staleTime,
    gcTime,
    retry: (failureCount, err) => {
      // Don't retry on 4xx errors
      if (err instanceof Error && err.message.includes('HTTP error! status: 4')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // ===== MUTATIONS =====

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      if (!businessId) throw new Error('Business ID is required');
      
      // Create locally first for offline support
      const now = new Date().toISOString();
      const newProduct: Product = {
        ...data,
        businessId,
        isActive: true,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        version: 1,
        lastModifiedAt: now,
      };

      const localId = await db.products.add(newProduct);
      newProduct.id = localId;

      // Add to sync queue
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: localId.toString(),
        action: 'create',
      });

      // If online, try to sync immediately
      if (isOnline) {
        try {
          const serverProduct = await productsApi.createProduct(businessId, data);
          
          // Update local product with server data
          await db.products.update(localId, {
            ...serverProduct,
            syncStatus: 'synced',
          });

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['products', businessId] });
          
          return serverProduct;
        } catch (err) {
          console.warn('Failed to sync product creation:', err);
          // Return local product, will sync later
          return newProduct;
        }
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
      return newProduct;
    },
    onSuccess: (product) => {
      toast.success(`Producto "${product.name}" creado exitosamente`);
    },
    onError: (err) => {
      toast.error(`Error al crear producto: ${err.message}`);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductRequest }) => {
      if (!businessId) throw new Error('Business ID is required');
      
      // Update locally first
      const now = new Date().toISOString();
      const updateData = {
        ...data,
        updatedAt: now,
        lastModifiedAt: now,
        syncStatus: 'pending' as const,
      };

      await db.products.update(parseInt(id), updateData);

      // Add to sync queue
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: id,
        action: 'update',
      });

      // If online, try to sync immediately
      if (isOnline) {
        try {
          const serverProduct = await productsApi.updateProduct(businessId, id, data);
          
          // Update local product with server data
          await db.products.update(parseInt(id), {
            ...serverProduct,
            syncStatus: 'synced',
          });

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['products', businessId] });
          
          return serverProduct;
        } catch (err) {
          console.warn('Failed to sync product update:', err);
          // Return local product, will sync later
          const localProduct = await db.products.get(parseInt(id));
          return localProduct!;
        }
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
      const localProduct = await db.products.get(parseInt(id));
      return localProduct!;
    },
    onSuccess: (product) => {
      toast.success(`Producto "${product.name}" actualizado exitosamente`);
    },
    onError: (err) => {
      toast.error(`Error al actualizar producto: ${err.message}`);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!businessId) throw new Error('Business ID is required');
      
      // Soft delete locally first
      await db.products.update(parseInt(id), {
        isActive: false,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      });

      // Add to sync queue
      await db.addToSyncQueue({
        entityType: 'product',
        entityId: id,
        action: 'delete',
      });

      // If online, try to sync immediately
      if (isOnline) {
        try {
          await productsApi.deleteProduct(businessId, id);
          
          // Remove from local database
          await db.products.delete(parseInt(id));
        } catch (err) {
          console.warn('Failed to sync product deletion:', err);
          // Will sync later
        }
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products', businessId] });
    },
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente');
    },
    onError: (err) => {
      toast.error(`Error al eliminar producto: ${err.message}`);
    },
  });

  // ===== COMPUTED VALUES =====

  const products = productsData || [];
  const allProducts = products;
  const activeProducts = products.filter(product => product.isActive);
  const categories = extractCategories(products);

  // ===== RETURN =====

  return {
    // Data
    products: activeProducts,
    allProducts,
    categories,
    
    // Loading states
    isLoading,
    isFetching,
    isError,
    
    // Error handling
    error: error,
    
    // Actions
    refetch,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: (id: string, data: UpdateProductRequest) => 
      updateProductMutation.mutateAsync({ id, data }),
    deleteProduct: deleteProductMutation.mutateAsync,
    
    // Mutations state
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
  };
} 