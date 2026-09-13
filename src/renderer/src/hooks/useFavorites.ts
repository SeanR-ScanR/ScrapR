import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoriteKey, type Favorite, type FavoriteIdentity } from '@shared/favoriteTypes';
import { favoritesQueries } from '@renderer/services/ipcQueries';
import { favoritesMutations, type FavoriteChange } from '@renderer/services/ipcMutations';

export function useFavorites(): {
  items: Favorite[];
  has: (identity: FavoriteIdentity) => boolean;
  loading: boolean;
  fetching: boolean;
  hasData: boolean;
  disabled: boolean;
  isPending: (identity: FavoriteIdentity) => boolean;
  error: string;
  change: (change: FavoriteChange) => void;
  retry: () => void;
} {
  const client = useQueryClient();
  const options = favoritesQueries.list();
  const query = useQuery(options);
  const mutationOptions = favoritesMutations.change(client);
  const mutation = useMutation(mutationOptions);
  const pending = useMutationState({
    filters: { mutationKey: mutationOptions.mutationKey, status: 'pending' },
    select: (mutation) => mutation.state.variables as FavoriteChange
  });
  const keys = new Map<string, string>();
  for (const record of query.data ?? []) {
    const canonical = favoriteKey(record);
    keys.set(canonical, canonical);
    for (const resource of record.aliases) {
      keys.set(favoriteKey({ ...record, resource }), canonical);
    }
  }
  const pendingKeys = new Set(
    pending.map((change) => {
      const identity = change.favorite
        ? {
            pluginId: change.resource.pluginId,
            sourceId: change.resource.sourceId,
            resource: [
              ...change.resource.parents.map(({ kind, id }) => ({ kind, id })),
              { kind: change.resource.kind, id: change.resource.id }
            ]
          }
        : change.resource;
      const key = favoriteKey(identity);
      return keys.get(key) ?? key;
    })
  );

  return {
    items: query.data ?? [],
    has: (identity: FavoriteIdentity) => keys.has(favoriteKey(identity)),
    loading: query.isLoading,
    fetching: query.isFetching,
    hasData: query.data !== undefined,
    disabled: query.data === undefined || query.isError,
    isPending: (identity: FavoriteIdentity) => {
      const key = favoriteKey(identity);
      return pendingKeys.has(keys.get(key) ?? key);
    },
    error: mutation.error?.message ?? query.error?.message ?? '',
    change: (change: FavoriteChange) => mutation.mutate(change),
    retry: () => {
      if (mutation.isError && mutation.variables) mutation.mutate(mutation.variables);
      else void query.refetch();
    }
  };
}
