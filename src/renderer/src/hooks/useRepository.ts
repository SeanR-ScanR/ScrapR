import { useQuery } from '@tanstack/react-query';
import { repositoryQueries } from '@renderer/services/ipcQueries';
import type { PluginMetadata } from '@shared/pluginTypes';

type RepositoryListState<T> = {
  items: T[];
  loading: boolean;
  fetching: boolean;
  hasData: boolean;
  error: string;
  retry: () => void;
};

export function usePlugins(): RepositoryListState<PluginMetadata> {
  const result = useQuery(repositoryQueries.listPlugins());
  return {
    items: result.data ?? [],
    loading: result.isLoading,
    fetching: result.isFetching,
    hasData: result.data !== undefined,
    error: result.isLoading ? '' : (result.error?.message ?? ''),
    retry: () => void result.refetch()
  };
}
