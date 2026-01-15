import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for our medical app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (10 minutes)
      staleTime: 10 * 60 * 1000,
      
      // Cache time: How long unused data stays in cache (15 minutes)
      gcTime: 15 * 60 * 1000,
      
      // Retry failed requests (useful for network issues)
      retry: 1,
      
      // Don't refetch on window focus - data stays fresh for 10 min anyway
      refetchOnWindowFocus: false,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Don't refetch on reconnect if data is still fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
