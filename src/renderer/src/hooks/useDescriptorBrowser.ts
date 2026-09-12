import { useEffect, useRef, useState } from 'react';
import { descriptorClient } from '@renderer/services/descriptorClient';
import type { AnyEntity, AnyPreview, DescriptorMetadata } from '@shared/pluginTypes';

export function useDescriptorBrowser(
  pluginId: string,
  sourceId: string,
  descriptor: DescriptorMetadata
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
  search: (query: string) => void;
  open: (entry: AnyPreview) => Promise<void>;
  back: (depth: number) => Promise<void>;
} {
  const { kind } = descriptor;
  const canSearch = descriptor.operations.includes('search');
  const canSuggest = descriptor.operations.includes('suggestions');
  const [scope, setScope] = useState({ pluginId, sourceId, kind, canSearch, canSuggest });
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<AnyPreview[]>([]);
  const [loading, setLoading] = useState(canSuggest);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [frames, setFrames] = useState<{ entity: AnyEntity; children: DescriptorMetadata[] }[]>([]);
  const [opening, setOpening] = useState(false);
  const [detailError, setDetailError] = useState('');
  const entryRequest = useRef(0);
  const detailRequest = useRef(0);
  const path = frames.map((frame) => frame.entity);
  const current = path.at(-1);
  const children = frames.at(-1)?.children ?? [];

  if (
    scope.pluginId !== pluginId ||
    scope.sourceId !== sourceId ||
    scope.kind !== kind ||
    scope.canSearch !== canSearch ||
    scope.canSuggest !== canSuggest
  ) {
    setScope({ pluginId, sourceId, kind, canSearch, canSuggest });
    setQuery('');
    setEntries([]);
    setLoading(canSuggest);
    setError('');
    setFrames([]);
    setOpening(false);
    setDetailError('');
  }

  useEffect(
    () => () => {
      detailRequest.current += 1;
    },
    [pluginId, sourceId, kind, canSearch, canSuggest]
  );

  useEffect(() => {
    const id = ++entryRequest.current;
    const supported = query ? canSearch : canSuggest;
    if (supported) {
      const pending = query
        ? descriptorClient.search(pluginId, sourceId, [], kind, query)
        : descriptorClient.suggestions(pluginId, sourceId, kind);
      pending
        .then((items) => {
          if (id === entryRequest.current) setEntries(items);
        })
        .catch((error: unknown) => {
          if (id === entryRequest.current) {
            setError(error instanceof Error ? error.message : String(error));
          }
        })
        .finally(() => {
          if (id === entryRequest.current) setLoading(false);
        });
    }
    return () => {
      entryRequest.current += 1;
    };
  }, [pluginId, sourceId, kind, canSearch, canSuggest, query, retryKey]);

  function search(nextQuery: string): void {
    entryRequest.current += 1;
    detailRequest.current += 1;
    setQuery(nextQuery);
    setEntries([]);
    setError('');
    setLoading(nextQuery ? canSearch : canSuggest);
    setFrames([]);
    setOpening(false);
    setDetailError('');
    setRetryKey((key) => key + 1);
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
      setFrames([...frames, { entity, children: nextChildren }]);
    } catch (error) {
      if (id === detailRequest.current) {
        setDetailError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (id === detailRequest.current) setOpening(false);
    }
  }

  async function back(depth: number): Promise<void> {
    detailRequest.current += 1;
    setFrames((loaded) => loaded.slice(0, Math.max(0, depth)));
    setOpening(false);
    setDetailError('');
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
    search,
    open,
    back
  };
}
