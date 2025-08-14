import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth.ts';
import { useOfflineSync } from './useOfflineSync.ts';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface DashboardStats {
  today: {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
    totalAmount: number;
  };
  thisMonth: {
    total: number;
    totalAmount: number;
    avgOrderValue: number;
  };
  lastMonth: {
    total: number;
    totalAmount: number;
  };
  growth: {
    orders: number;
    revenue: number;
  };
  totals: {
    products: number;
    clients: number;
  };
}

export function useDashboardStats() {
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', user?.businessId],
    queryFn: async () => {
      if (!user?.businessId) {
        throw new Error('Business ID required');
      }

      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats/${user.businessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching dashboard stats');
      }

      const data = await response.json();
      return data.stats as DashboardStats;
    },
    enabled: !!user?.businessId && isOnline,
    refetchInterval: isOnline ? 60000 : false, // Refetch every minute when online
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
} 