import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import type { FavoriteIdentity, FavoriteInput } from '@shared/favoriteTypes';
import { favoritesClient } from './favoritesClient';
import { favoritesQueries } from './ipcQueries';

export type FavoriteChange =
  { favorite: true; resource: FavoriteInput } | { favorite: false; resource: FavoriteIdentity };

export const favoritesMutations = {
  change: (client: QueryClient) =>
    mutationOptions({
      mutationKey: ['ipc', 'favorites:change'] as const,
      networkMode: 'always',
      retry: false,
      mutationFn: (change: FavoriteChange) =>
        change.favorite
          ? favoritesClient.add(change.resource)
          : favoritesClient.remove(change.resource),
      onSettled: () => client.invalidateQueries({ queryKey: favoritesQueries.list().queryKey })
    })
};
