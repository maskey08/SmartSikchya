import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no refetch)
      staleTime: 1000 * 60 * 5, // 5 minutes

      // How long unused data stays in cache
      gcTime: 1000 * 60 * 10, // 10 minutes

      // Don't hammer the API on every window focus
      refetchOnWindowFocus: false,

      // Retry failed requests once before showing error
      retry: 1,
    },
  },
});
