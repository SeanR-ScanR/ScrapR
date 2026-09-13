import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import './assets/main.css';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { router } from './router';
import { queryClient } from './services/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{ triggerMode: 'fixed', position: 'bottom-right' }}
          plugins={[
            { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
            { name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel router={router} /> }
          ]}
        />
      )}
    </QueryClientProvider>
  </StrictMode>
);
