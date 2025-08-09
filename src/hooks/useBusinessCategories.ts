import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/offline/db.ts';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { BusinessCategory } from '../types/index.ts';

export function useBusinessCategories(businessId: string) {
  const queryClient = useQueryClient();

  // For now, we'll work in offline-only mode since supabase client is not set up in frontend
  // This can be easily extended later when supabase is configured

  // Obtener categorías (offline-first)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['businessCategories', businessId],
    queryFn: async () => {
      // Primero obtener de local
      const localCategories = await db.getBusinessCategories(businessId);
      
      // TODO: Add Supabase sync when client is configured
      // For now, working in offline-only mode

      return localCategories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Crear categoría personalizada
  const createCustomCategory = useMutation({
    mutationFn: async (categoryData: {
      categoryId: string;
      categoryName: string;
      icon: string;
      satCode: string;
    }) => {
      const clientGeneratedId = uuidv4();
      const category: Omit<BusinessCategory, 'id'> = {
        ...categoryData,
        businessId,
        isActive: true,
        clientGeneratedId,
        syncStatus: 'pending',
        lastModifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await db.addBusinessCategory(category);

      // TODO: Add Supabase sync when client is configured
      console.log('Categoría creada en modo offline. Sincronización pendiente.');

      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCategories', businessId] });
      toast.success('Categoría creada exitosamente');
    },
    onError: (error) => {
      console.error('Error al crear categoría:', error);
      toast.error('Error al crear la categoría');
    }
  });

  // Inicializar categorías por defecto para un tipo de negocio
  const initializeDefaultCategories = useMutation({
    mutationFn: async (businessType: string) => {
      const defaultCategories = await db.getDefaultCategoriesForBusinessType(businessType);
      
      const categoriesToAdd = defaultCategories.map(cat => ({
        ...cat,
        businessId,
        clientGeneratedId: uuidv4()
      }));

      for (const category of categoriesToAdd) {
        await db.addBusinessCategory(category);
      }

      // TODO: Add Supabase sync when client is configured
      console.log('Categorías por defecto creadas en modo offline.');

      return categoriesToAdd;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCategories', businessId] });
      toast.success('Categorías inicializadas correctamente');
    },
    onError: (error) => {
      console.error('Error al inicializar categorías:', error);
      toast.error('Error al inicializar las categorías');
    }
  });

  // Actualizar categoría existente
  const updateCategory = useMutation({
    mutationFn: async ({
      categoryId,
      updates
    }: {
      categoryId: string;
      updates: Partial<Pick<BusinessCategory, 'categoryName' | 'icon' | 'satCode' | 'isActive'>>;
    }) => {
      const updatedData = {
        ...updates,
        lastModifiedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      };

      await db.businessCategories
        .where('businessId')
        .equals(businessId)
        .and(cat => cat.categoryId === categoryId)
        .modify(updatedData);

      // TODO: Add Supabase sync when client is configured
      console.log('Categoría actualizada en modo offline.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCategories', businessId] });
      toast.success('Categoría actualizada exitosamente');
    }
  });

  // Eliminar categoría (soft delete)
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      await db.businessCategories
        .where('businessId')
        .equals(businessId)
        .and(cat => cat.categoryId === categoryId)
        .modify({ 
          isActive: false, 
          lastModifiedAt: new Date().toISOString(),
          syncStatus: 'pending'
        });

      // TODO: Add Supabase sync when client is configured
      console.log('Categoría eliminada en modo offline.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCategories', businessId] });
      toast.success('Categoría eliminada exitosamente');
    }
  });

  // Helper para obtener una categoría por ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.categoryId === categoryId);
  };

  // Helper para obtener productos agrupados por categoría
  const getCategoriesWithProductCount = async () => {
    const allProducts = await db.getProductsByBusiness(businessId);
    return categories.map(category => ({
      ...category,
      productCount: allProducts.filter(product => product.categoryId === category.categoryId).length
    }));
  };

  return {
    categories,
    isLoading,
    createCustomCategory,
    initializeDefaultCategories,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesWithProductCount,
    // Status flags
    isCreating: createCustomCategory.isPending,
    isInitializing: initializeDefaultCategories.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
  };
} 