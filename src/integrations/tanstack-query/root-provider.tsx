import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ✅ IMPLEMENTAR: Query invalidation strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if ('status' in error && error.status === 404) return false;
        return failureCount < 3;
      }
    }
  }
})

export function getContext() {
  return {
    queryClient,
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
