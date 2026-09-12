import { createRootRoute } from '@tanstack/react-router';
import App from '@renderer/App/App';
import PageNotFound from '@renderer/pages/PageNotFound/PageNotFound';

export const Route = createRootRoute({
  component: App,
  notFoundComponent: PageNotFound
});
