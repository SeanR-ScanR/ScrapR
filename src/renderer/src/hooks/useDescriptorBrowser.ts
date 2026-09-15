import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { descriptorQueries } from '@renderer/services/ipcQueries';
import { resourcePathQuery, type DiscoverSearch } from '@renderer/services/discoverNavigation';
import type {
  AnyEntity,
  AnyPreview,
  DescriptorMetadata,
  SourceMetadata
} from '@shared/pluginTypes';

export type DescriptorBrowserEntity = {
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
  openingEntry: AnyPreview | null;
  detailError: string;
  resourcePending: boolean;
  descriptorProps: DescriptorBrowserProps;
  retryResource: () => void;
  search: (query: string) => void;
  open: (entry: AnyPreview) => Promise<void>;
  back: (depth: number) => void;
};

export interface DescriptorBrowserProps {
  pluginId: string;
  source: SourceMetadata;
  descriptor: DescriptorMetadata;
  search: DiscoverSearch;
  navigate: (search: DiscoverSearch) => void;
}

export function useDescriptorBrowser(props: DescriptorBrowserProps): DescriptorBrowserEntity {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { kind } = props.descriptor;
  const query = props.search.query ?? '';
  const references = props.search.resource ?? [];
  const pathQuery = useQuery({
    ...resourcePathQuery(
      queryClient,
      props.pluginId,
      props.source.id,
      references,
      props.search.origin
    ),
    enabled: references.length > 0
  });
  const path = references.length ? (pathQuery.data ?? []) : [];
  const current = path.at(-1);
  const canSearch = props.descriptor.operations.includes('search');
  const canSuggest = props.descriptor.operations.includes('suggestions');
  const searchQuery = useQuery({
    ...descriptorQueries.search(props.pluginId, props.source.id, [], kind, query),
    enabled: !props.search.resource && !!query && canSearch
  });
  const suggestionsQuery = useQuery({
    ...descriptorQueries.suggestions(props.pluginId, props.source.id, kind),
    enabled: !props.search.resource && !query && canSuggest
  });
  const entriesQuery = query ? searchQuery : suggestionsQuery;
  const childrenQuery = useQuery({
    ...descriptorQueries.list(
      props.pluginId,
      props.source.id,
      path.map((entity) => entity.kind)
    ),
    enabled: !!current
  });
  const [openingEntry, setOpeningEntry] = useState<AnyPreview | null>(null);
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
    if (!props.search.resource && nextQuery === query) {
      if (query ? canSearch : canSuggest) void entriesQuery.refetch();
    } else {
      props.navigate({ kind, query: nextQuery || undefined });
    }
  }

  async function open(entry: AnyPreview): Promise<void> {
    const id = ++detailRequest.current;
    setOpeningEntry(entry);
    setDetailError('');
    try {
      const entity = await queryClient.query(
        descriptorQueries.get(props.pluginId, props.source.id, path, entry.kind, entry.id)
      );
      if (id !== detailRequest.current) return;
      await queryClient.query(
        descriptorQueries.list(
          props.pluginId,
          props.source.id,
          [...path, entity].map((parent) => parent.kind)
        )
      );
      if (id !== detailRequest.current) return;
      const resource = [...references, { kind: entry.kind, id: entry.id }];
      queryClient.setQueryData(
        resourcePathQuery(
          queryClient,
          props.pluginId,
          props.source.id,
          resource,
          props.search.origin
        ).queryKey,
        [...path, entity]
      );
      props.navigate({
        kind,
        query: query || undefined,
        resource,
        origin: props.search.origin
      });
    } catch (error) {
      if (id === detailRequest.current)
        setDetailError(error instanceof Error ? error.message : String(error));
    } finally {
      if (id === detailRequest.current) setOpeningEntry(null);
    }
  }

  function back(depth: number): void {
    detailRequest.current += 1;
    setOpeningEntry(null);
    setDetailError('');
    const sliced = references.slice(0, Math.max(0, depth));
    props.navigate({
      kind,
      query: query || undefined,
      resource: sliced.length ? sliced : undefined,
      origin: sliced.length ? props.search.origin : undefined
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
    openingEntry,
    opening:
      openingEntry !== null ||
      (references.length > 0 && pathQuery.isFetching) ||
      (!!current && childrenQuery.isFetching),
    detailError:
      detailError ||
      (references.length ? (pathQuery.error?.message ?? '') : '') ||
      (current && !childrenQuery.isLoading ? (childrenQuery.error?.message ?? '') : ''),
    resourcePending: references.length > 0 && !current,
    descriptorProps: props,
    retryResource: () => {
      void pathQuery.refetch();
    },
    search,
    open,
    back
  };
}
