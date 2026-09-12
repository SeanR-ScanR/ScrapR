import { createHashHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { queryClient } from './services/queryClient';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Electron loads index.html from disk; routes must not change the document path.
  history: createHashHistory(),
  defaultPreload: 'intent',
  // Let Query decide whether preloaded data needs another IPC request.
  defaultPreloadStaleTime: 0
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
