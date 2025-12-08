import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 *
 * This configuration enables:
 * - Aggressive caching for instant page loads
 * - Background refetching to keep data fresh
 * - Automatic retry on failure
 * - Stale-while-revalidate pattern
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,

      // Retry failed requests 2 times
      retry: 2,

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Enable network mode for better offline handling
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',
    },
  },
});
