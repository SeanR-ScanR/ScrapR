import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import App from '@renderer/App/App';
import PageNotFound from '@renderer/pages/PageNotFound/PageNotFound';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: App,
  notFoundComponent: PageNotFound
});
