import { useEffect, useEffectEvent, useRef } from 'react';
import type { AnyPreview, ThumbnailSource } from '@shared/pluginTypes';
import {
  subscribeThumbnail,
  type ThumbnailSubscription
} from '@renderer/services/thumbnailScheduler';

export function useThumbnailPrefetch(
  entries: readonly AnyPreview[],
  source: ThumbnailSource
): void {
  const subscriptions = useRef(new Map<string, ThumbnailSubscription>());
  const { pluginId, sourceId } = source;
  const pathKey = JSON.stringify(source.path);
  const getSource = useEffectEvent(() => source);

  useEffect(() => {
    const current = subscriptions.current;
    const owner = getSource();
    const retained = new Set<string>();
    for (const { thumbnail } of entries) {
      if (!thumbnail || typeof thumbnail === 'string') continue;
      const key = JSON.stringify([pluginId, sourceId, owner.path, thumbnail.key]);
      if (retained.has(key)) continue;
      retained.add(key);
      const existing = current.get(key);
      if (existing) existing.updateReference(thumbnail);
      else
        current.set(
          key,
          subscribeThumbnail(thumbnail, owner, null, () => {})
        );
    }
    for (const [key, subscription] of current) {
      if (retained.has(key)) continue;
      subscription.release();
      current.delete(key);
    }
  }, [entries, pluginId, sourceId, pathKey]);

  useEffect(() => {
    const current = subscriptions.current;
    return () => {
      for (const subscription of current.values()) subscription.release();
      current.clear();
    };
  }, []);
}
