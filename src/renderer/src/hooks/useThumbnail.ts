import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Thumbnail, ThumbnailSource } from '@shared/pluginTypes';
import {
  subscribeThumbnail,
  type ThumbnailState,
  type ThumbnailSubscription
} from '@renderer/services/thumbnailScheduler';

export function useThumbnail(
  reference: Thumbnail | undefined,
  source: ThumbnailSource | undefined,
  element: HTMLElement | null
): ThumbnailState {
  const key = typeof reference === 'string' ? reference : reference?.key;
  const descriptorPath = JSON.stringify(source?.path);
  const pluginId = source?.pluginId;
  const sourceId = source?.sourceId;
  const subscription = useRef<ThumbnailSubscription | undefined>(undefined);
  const getReference = useEffectEvent(() => reference);
  const getSource = useEffectEvent(() => source);
  const [result, setResult] = useState<{
    key: string;
    pluginId: string;
    sourceId: string;
    descriptorPath: string | undefined;
    element: HTMLElement;
    state: ThumbnailState;
  }>();

  useEffect(() => {
    const current = getReference();
    const owner = getSource();
    if (!current || typeof current === 'string' || !owner || !element) return;
    const next = subscribeThumbnail(current, owner, element, (state) => {
      const { pluginId, sourceId } = owner;
      setResult({ key: current.key, pluginId, sourceId, descriptorPath, element, state });
    });
    subscription.current = next;
    return () => {
      next.release();
      subscription.current = undefined;
    };
  }, [key, pluginId, sourceId, descriptorPath, element]);

  // Zod may recreate payload objects on every render. Refresh without resubscribing,
  // notifying React, or retrying a ready/failed image with the same scoped key.
  useEffect(() => {
    if (reference && typeof reference !== 'string')
      subscription.current?.updateReference(reference);
  }, [reference]);

  const matches =
    result?.key === key &&
    result?.pluginId === pluginId &&
    result?.sourceId === sourceId &&
    result?.descriptorPath === descriptorPath &&
    result?.element === element;
  // Forget released URLs even if this card later returns to the same image key.
  if (result && !matches) setResult(undefined);

  if (typeof reference === 'string') return { src: reference, loading: false };
  if (key === undefined || pluginId === undefined || sourceId === undefined || !element) {
    return { loading: false };
  }
  if (matches && result) return result.state;
  return { loading: true };
}
