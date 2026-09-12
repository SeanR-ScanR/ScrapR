import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { descriptorClient } from '@renderer/services/descriptorClient';
import {
  cacheResourcePath,
  getResourcePath,
  type ExploreSearch,
  type ResourceFrame
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
  const [entries, setEntries] = useState<AnyPreview[]>([]);
  const [loading, setLoading] = useState(!routeSearch.resource && (query ? canSearch : canSuggest));
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [loadedChildren, setLoadedChildren] = useState<{
    frame: ResourceFrame;
    children: DescriptorMetadata[];
  }>();
  const children =
    frame && loadedChildren?.frame === frame ? loadedChildren.children : (frame?.children ?? []);
  const [opening, setOpening] = useState(!!frame && !frame.children);
  const [detailError, setDetailError] = useState('');
  const entryRequest = useRef(0);
  const detailRequest = useRef(0);

  useEffect(() => {
    const invalidate = (): void => {
      entryRequest.current += 1;
      detailRequest.current += 1;
    };
    const unsubscribe = router.subscribe('onBeforeNavigate', invalidate);
    return () => {
      unsubscribe();
      invalidate();
    };
  }, [router]);

  useEffect(() => {
    const id = ++entryRequest.current;
    if (routeSearch.resource || !(query ? canSearch : canSuggest)) return;
    const pending = query
      ? descriptorClient.search(pluginId, sourceId, [], kind, query)
      : descriptorClient.suggestions(pluginId, sourceId, kind);
    void pending
      .then((items) => {
        if (id === entryRequest.current) setEntries(items);
      })
      .catch((error: unknown) => {
        if (id === entryRequest.current)
          setError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (id === entryRequest.current) setLoading(false);
      });
    return () => {
      entryRequest.current += 1;
    };
  }, [pluginId, sourceId, kind, canSearch, canSuggest, query, routeSearch.resource, retryKey]);

  useEffect(() => {
    if (!frame || frame.children) return;
    const id = ++detailRequest.current;
    void descriptorClient
      .list(
        pluginId,
        sourceId,
        (frames ?? []).map(({ entity }) => entity.kind)
      )
      .then((items) => {
        if (id !== detailRequest.current) return;
        frame.children = items;
        setLoadedChildren({ frame, children: items });
      })
      .catch((error: unknown) => {
        if (id === detailRequest.current)
          setDetailError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (id === detailRequest.current) setOpening(false);
      });
    return () => {
      detailRequest.current += 1;
    };
  }, [pluginId, sourceId, frame, frames]);

  function search(nextQuery: string): void {
    if (!routeSearch.resource && nextQuery === query) {
      setLoading(query ? canSearch : canSuggest);
      setError('');
      setRetryKey((key) => key + 1);
    } else {
      navigate({ kind, query: nextQuery || undefined });
    }
  }

  async function open(entry: AnyPreview): Promise<void> {
    const id = ++detailRequest.current;
    setOpening(true);
    setDetailError('');
    try {
      const entity = await descriptorClient.get(pluginId, sourceId, path, entry.kind, entry.id);
      if (id !== detailRequest.current) return;
      const nextChildren = await descriptorClient.list(
        pluginId,
        sourceId,
        [...path, entity].map((parent) => parent.kind)
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
    entries,
    loading,
    error,
    path,
    current,
    children,
    opening,
    detailError,
    expired,
    search,
    open,
    back
  };
}
