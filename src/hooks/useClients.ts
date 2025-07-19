import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import { useAuth } from './useAuth';
import type { Client } from '@/types';

// ===== API FUNCTIONS =====

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// ===== MAIN HOOK =====

export function useClients() {
  const { user } = useAuth();
  const { addPendingChange } = useOfflineSync();
  const queryClient = useQueryClient();

  // Fetch clients
  const clientsQuery = useQuery({
    queryKey: ['clients', user?.businessId],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Error fetching clients');
      return response.json();
    },
    enabled: !!user?.businessId
  });

  // Create client
  const createMutation = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'business_id' | 'total_orders' | 'total_spent' | 'last_order_date' | 'is_active'>) => {
      const response = await fetch(`${BACKEND_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(client)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: Error, client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'business_id' | 'total_orders' | 'total_spent' | 'last_order_date' | 'is_active'>) => {
      // Add to offline sync if failed
      addPendingChange({
        type: 'create',
        data: client
      });
      toast.error(`Error al crear cliente: ${error.message}`);
    }
  });

  // Update client
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(client)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: Error, variables: Partial<Client> & { id: string }) => {
      const { id, ...clientData } = variables;
      addPendingChange({
        type: 'update',
        data: { id, ...clientData }
      });
      toast.error(`Error al actualizar cliente: ${error.message}`);
    }
  });

  // Delete client
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: Error, id: string) => {
      addPendingChange({
        type: 'delete',
        data: { id }
      });
      toast.error(`Error al eliminar cliente: ${error.message}`);
    }
  });

  // Get client stats
  const statsQuery = useQuery({
    queryKey: ['clients-stats', user?.businessId],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/clients/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Error fetching client stats');
      return response.json();
    },
    enabled: !!user?.businessId
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
} 