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
        } else if (response.status === 500) {
          console.error('❌ Server error (500) in dashboard stats API - returning mock data');
          // Return mock data instead of throwing error to prevent infinite retry
          return {
            today: { total: 0, pending: 0, preparing: 0, ready: 0, delivered: 0, cancelled: 0, totalAmount: 0 },
            thisMonth: { total: 0, totalAmount: 0, avgOrderValue: 0 },
            lastMonth: { total: 0, totalAmount: 0 },
            growth: { orders: 0, revenue: 0 },
            totals: { products: 0, clients: 0 }
          } as DashboardStats;
        }
        throw new Error('Error fetching dashboard stats');
      }

      const data = await response.json();
      return data.stats as DashboardStats;
    },
    enabled: !!user?.businessId && isOnline, // ✅ RE-ENABLED with mock data from backend
    refetchInterval: false, // Disable auto-refetch to prevent loops
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to reduce API calls
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    retry: false, // ✅ DISABLE ALL RETRIES to prevent infinite loop
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
} 