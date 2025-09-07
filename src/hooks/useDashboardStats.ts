import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth.ts';
import { useOfflineSync } from './useOfflineSync.ts';
import { supabase } from '../utils/supabase.ts';

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

      // Get auth token from localStorage or Supabase session
      let authToken = localStorage.getItem('authToken');
      if (!authToken && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.access_token) {
            authToken = session.access_token;
          }
        } catch (error) {
          console.error('Error getting Supabase session for dashboard stats:', error);
        }
      }

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats/${user.businessId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ Unauthorized request to dashboard stats API');
          throw new Error('Unauthorized - please log in again');
        }
        throw new Error('Error fetching dashboard stats');
      }

      const data = await response.json();
      return data.stats as DashboardStats;
    },
    enabled: !!user?.businessId && isOnline,
    refetchInterval: false, // Disable auto-refetch to prevent loops
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to reduce API calls
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
} 