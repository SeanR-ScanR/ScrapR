import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { descriptorQueries } from '@renderer/services/ipcQueries';
import {
  cacheResourcePath,
  getResourcePath,
  type ExploreSearch
} from '@renderer/services/exploreNavigation';
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
  expired: boolean;
  search: (query: string) => void;
  open: (entry: AnyPreview) => Promise<void>;
  back: (depth: number) => void;
} {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { kind } = descriptor;
  const query = routeSearch.query ?? '';
  const frames = routeSearch.resource
    ? getResourcePath(pluginId, sourceId, routeSearch.resource)
    : undefined;
  const expired = !!routeSearch.resource && (!frames?.length || frames[0].entity.kind !== kind);
  const path = expired ? [] : (frames ?? []).map((frame) => frame.entity);
  const current = path.at(-1);
  const frame = expired ? undefined : frames?.at(-1);
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
    enabled: !!frame,
    placeholderData: frame?.children
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
      const nextChildren = await queryClient.query(
        descriptorQueries.list(
          pluginId,
          sourceId,
          [...path, entity].map((parent) => parent.kind)
        )
      );
      if (id !== detailRequest.current) return;
      const resource = cacheResourcePath(pluginId, sourceId, [
        ...(frames ?? []),
        { entity, children: nextChildren }
      ]);
      navigate({ kind, query: query || undefined, resource });
    } catch (error) {
      if (id === detailRequest.current)
        setDetailError(error instanceof Error ? error.message : String(error));
    } finally {
      if (id === detailRequest.current) setOpening(false);
    }
  }

  function back(depth: number): void {
    const sliced = (frames ?? []).slice(0, Math.max(0, depth));
    navigate({
      kind,
      query: query || undefined,
      resource: sliced.length ? cacheResourcePath(pluginId, sourceId, sliced) : undefined
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
    children: frame ? (childrenQuery.data ?? frame.children ?? []) : [],
    opening: opening || (!!frame && childrenQuery.isLoading),
    detailError:
      detailError ||
      (frame && !childrenQuery.isLoading ? (childrenQuery.error?.message ?? '') : ''),
    expired,
    search,
    open,
    back
  };
}
