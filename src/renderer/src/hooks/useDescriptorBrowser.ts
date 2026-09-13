import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { descriptorQueries } from '@renderer/services/ipcQueries';
import { resourcePathQuery, type ExploreSearch } from '@renderer/services/exploreNavigation';
import type { AnyEntity, AnyPreview, DescriptorMetadata } from '@shared/pluginTypes';

export function useDescriptorBrowser(
  pluginId: string,
  sourceId: string,
  descriptor: DescriptorMetadata,
  routeSearch: ExploreSearch,
  navigate: (search: ExploreSearch) => void
): {
  query: string;
  entries: AnyPreview[];
  loading: boolean;
  fetching: boolean;
  hasData: boolean;
  error: string;
  path: AnyEntity[];
  current: AnyEntity | undefined;
  children: DescriptorMetadata[];
  opening: boolean;
  detailError: string;
  resourcePending: boolean;
  retryResource: () => void;
  search: (query: string) => void;
  open: (entry: AnyPreview) => Promise<void>;
  back: (depth: number) => void;
} {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { kind } = descriptor;
  const query = routeSearch.query ?? '';
  const references = routeSearch.resource ?? [];
  const pathQuery = useQuery({
    ...resourcePathQuery(queryClient, pluginId, sourceId, references, routeSearch.origin),
    enabled: references.length > 0
  });
  const path = references.length ? (pathQuery.data ?? []) : [];
  const current = path.at(-1);
  const canSearch = descriptor.operations.includes('search');
  const canSuggest = descriptor.operations.includes('suggestions');
  const searchQuery = useQuery({
    ...descriptorQueries.search(pluginId, sourceId, [], kind, query),
    enabled: !routeSearch.resource && !!query && canSearch
  });
  const suggestionsQuery = useQuery({
    ...descriptorQueries.suggestions(pluginId, sourceId, kind),
    enabled: !routeSearch.resource && !query && canSuggest
  });
  const entriesQuery = query ? searchQuery : suggestionsQuery;
  const childrenQuery = useQuery({
    ...descriptorQueries.list(
      pluginId,
      sourceId,
      path.map((entity) => entity.kind)
    ),
    enabled: !!current
  });
  const [opening, setOpening] = useState(false);
  const [detailError, setDetailError] = useState('');
  const detailRequest = useRef(0);

  useEffect(() => {
    const invalidate = (): void => {
      detailRequest.current += 1;
    };
    const unsubscribe = router.subscribe('onBeforeNavigate', invalidate);
    return () => {
      unsubscribe();
      invalidate();
    };
  }, [router]);

  function search(nextQuery: string): void {
    if (!routeSearch.resource && nextQuery === query) {
      if (query ? canSearch : canSuggest) void entriesQuery.refetch();
    } else {
      navigate({ kind, query: nextQuery || undefined });
    }
  }

  async function open(entry: AnyPreview): Promise<void> {
    const id = ++detailRequest.current;
    setOpening(true);
    setDetailError('');
    try {
      const entity = await queryClient.query(
        descriptorQueries.get(pluginId, sourceId, path, entry.kind, entry.id)
      );
      if (id !== detailRequest.current) return;
      await queryClient.query(
        descriptorQueries.list(
          pluginId,
          sourceId,
          [...path, entity].map((parent) => parent.kind)
        )
      );
      if (id !== detailRequest.current) return;
      const resource = [...references, { kind: entry.kind, id: entry.id }];
      queryClient.setQueryData(
        resourcePathQuery(queryClient, pluginId, sourceId, resource, routeSearch.origin).queryKey,
        [...path, entity]
      );
      navigate({ kind, query: query || undefined, resource, origin: routeSearch.origin });
    } catch (error) {
      if (id === detailRequest.current)
        setDetailError(error instanceof Error ? error.message : String(error));
    } finally {
      if (id === detailRequest.current) setOpening(false);
    }
  }

  function back(depth: number): void {
    const sliced = references.slice(0, Math.max(0, depth));
    navigate({
      kind,
      query: query || undefined,
      resource: sliced.length ? sliced : undefined,
      origin: sliced.length ? routeSearch.origin : undefined
    });
  }

  return {
    query,
    entries: entriesQuery.data ?? [],
    loading: entriesQuery.isLoading,
    fetching: entriesQuery.isFetching,
    hasData: entriesQuery.data !== undefined,
    error: entriesQuery.isLoading ? '' : (entriesQuery.error?.message ?? ''),
    path,
    current,
    children: current ? (childrenQuery.data ?? []) : [],
    opening:
      opening ||
      (references.length > 0 && pathQuery.isFetching) ||
      (!!current && childrenQuery.isLoading),
    detailError:
      detailError ||
      (references.length ? (pathQuery.error?.message ?? '') : '') ||
      (current && !childrenQuery.isLoading ? (childrenQuery.error?.message ?? '') : ''),
    resourcePending: references.length > 0 && !current,
    retryResource: () => {
      void pathQuery.refetch();
    },
    search,
    open,
    back
  };
}
