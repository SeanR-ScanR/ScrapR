import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Avoid automatic retries and focus/reconnect refetches for scraping requests.
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // IPC works independently of the renderer's network connectivity.
        networkMode: 'always'
      }
    }
  });
}

export const queryClient = createQueryClient();
