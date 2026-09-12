import { useEffect, useRef, useState } from 'react';
import { repositoryClient } from '@renderer/services/repositoryClient';
import type { PluginMetadata } from '@shared/pluginTypes';

type RepositoryListState<T> = {
  items: T[];
  loading: boolean;
  error: string;
  retry: () => void;
};

function useRepositoryList<T>(load: () => Promise<T[]>): RepositoryListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    Promise.resolve()
      .then(load)
      .then((result) => {
        if (id !== request.current) return;
        setItems(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (id !== request.current) return;
        setError(cause instanceof Error ? cause.message : String(cause));
        setLoading(false);
      });
    return () => {
      request.current += 1;
    };
  }, [load, retryKey]);

  function retry(): void {
    request.current += 1;
    setItems([]);
    setLoading(true);
    setError('');
    setRetryKey((key) => key + 1);
  }

  return { items, loading, error, retry };
}

export function usePlugins(): RepositoryListState<PluginMetadata> {
  return useRepositoryList(repositoryClient.listPlugins);
}
