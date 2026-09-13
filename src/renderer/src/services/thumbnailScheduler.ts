import type { ThumbnailMetadata, ThumbnailSource } from '@shared/pluginTypes';
import { CancelledError, QueryObserver, queryOptions } from '@tanstack/react-query';
import { invoke } from './ipcClient';
import { queryClient } from './queryClient';
import { ViewportPriorityObserver, ViewportPriorityLevel } from '../utils/viewportPriorityObserver';

export type ThumbnailState = { src?: string; error?: Error; loading: boolean };
export type ThumbnailSubscription = {
  release: () => void;
  updateReference: (reference: ThumbnailMetadata) => void;
};

type Subscriber = {
  element: HTMLElement | null;
  notify: (state: ThumbnailState) => void;
  released: boolean;
};
type Request = { id: string; priority: number; canceled: boolean };
type Job = {
  key: string;
  source: ThumbnailSource;
  reference: ThumbnailMetadata;
  subscribers: Set<Subscriber>;
  state: ThumbnailState;
  request?: Request;
  releaseQuery?: () => void;
};

const jobs = new Map<string, Job>();
const viewport = new ViewportPriorityObserver(schedule);
let frame: number | undefined;

function options(job: Job): ReturnType<typeof queryOptions<Blob>> {
  return queryOptions<Blob>({
    queryKey: [
      'thumbnail',
      job.source.pluginId,
      job.source.sourceId,
      job.source.path,
      job.reference.key
    ],
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
    structuralSharing: false
  });
}

function cachedBlob(job: Job): Blob | undefined {
  const cached = queryClient.getQueryState(options(job).queryKey);
  return cached?.isInvalidated ? undefined : cached?.data;
}

function publish(job: Job): void {
  for (const subscriber of job.subscribers) {
    if (!subscriber.element) continue;
    queueMicrotask(() => {
      if (!subscriber.released) subscriber.notify(job.state);
    });
  }
}

function showImage(job: Job, blob: Blob): void {
  const mounted = [...job.subscribers].some(({ element }) => element);
  job.state = {
    src: job.state.src ?? (mounted ? URL.createObjectURL(blob) : undefined),
    loading: false
  };
  publish(job);
}

function priority(job: Job): number {
  let value: number = ViewportPriorityLevel.BACKGROUND;
  for (const { element } of job.subscribers) {
    if (element) value = Math.max(value, viewport.priority(element));
  }
  return value;
}

function schedule(): void {
  if (frame === undefined && jobs.size) frame = requestAnimationFrame(flush);
}

function flush(): void {
  frame = undefined;
  viewport.measure();
  const pending: { job: Job; priority: number }[] = [];
  for (const job of jobs.values()) {
    if (!job.subscribers.size) continue;
    const value = priority(job);
    if (job.request) {
      if (!job.request.canceled && job.request.priority !== value) {
        job.request.priority = value;
        void invoke('plugin.source.descriptor.thumbnail:priority', job.request.id, value).catch(
          () => {}
        );
      }
    } else if (job.state.loading) {
      const cached = cachedBlob(job);
      if (cached) showImage(job, cached);
      else pending.push({ job, priority: value });
    }
  }
  pending.sort((a, b) => b.priority - a.priority);
  for (const item of pending) {
    const request: Request = { id: crypto.randomUUID(), priority: item.priority, canceled: false };
    item.job.request = request;
    void load(item.job, request);
  }
}

async function load(job: Job, request: Request): Promise<void> {
  let transportSettled: Promise<void> | undefined;
  try {
    const blob = await queryClient.query({
      ...options(job),
      queryFn: async ({ signal }) => {
        signal.throwIfAborted();
        const transport = invoke(
          'plugin.source.descriptor.thumbnail:load',
          job.source.pluginId,
          job.source.sourceId,
          job.source.path,
          request.id,
          job.reference,
          request.priority
        );
        transportSettled = transport.then(
          () => {},
          () => {}
        );
        const abort = (): void => {
          request.canceled = true;
          void invoke('plugin.source.descriptor.thumbnail:cancel', request.id).catch(() => {});
        };
        signal.addEventListener('abort', abort, { once: true });
        try {
          const result = await transport;
          signal.throwIfAborted();
          if ('canceled' in result) throw new CancelledError({ revert: true });
          return new Blob([new Uint8Array(result.bytes)], { type: result.contentType });
        } finally {
          signal.removeEventListener('abort', abort);
        }
      }
    });
    if (!request.canceled && job.subscribers.size) showImage(job, blob);
  } catch (error) {
    if (error instanceof CancelledError) request.canceled = true;
    if (!request.canceled && job.subscribers.size) {
      job.state = {
        error: error instanceof Error ? error : new Error(String(error)),
        loading: false
      };
      publish(job);
    }
  } finally {
    await transportSettled;
    job.request = undefined;
    if (!job.subscribers.size) jobs.delete(job.key);
    else if (request.canceled) {
      job.state = { loading: true };
      publish(job);
    }
    schedule();
  }
}

export function subscribeThumbnail(
  reference: ThumbnailMetadata,
  source: ThumbnailSource,
  element: HTMLElement | null,
  onChange: (state: ThumbnailState) => void
): ThumbnailSubscription {
  const key = JSON.stringify([source.pluginId, source.sourceId, source.path, reference.key]);
  let job = jobs.get(key);
  if (!job) {
    job = {
      key,
      source: { ...source },
      reference,
      subscribers: new Set(),
      state: { loading: true }
    };
    jobs.set(key, job);
  }
  const ownedJob = job;
  job.reference = reference;
  const subscriber: Subscriber = { element, notify: onChange, released: false };
  job.subscribers.add(subscriber);
  const releaseViewport = element ? viewport.observe(element) : undefined;
  if (!job.releaseQuery) {
    const observer = new QueryObserver(queryClient, { ...options(job), enabled: false });
    job.releaseQuery = observer.subscribe(() => {});
  }
  if (!job.request && !job.state.error && !job.state.src) {
    const cached = cachedBlob(job);
    if (cached) showImage(job, cached);
    else job.state = { loading: true };
  }
  queueMicrotask(() => {
    if (!subscriber.released) subscriber.notify(ownedJob.state);
  });
  schedule();

  return {
    updateReference(next): void {
      if (!subscriber.released && next.key === ownedJob.reference.key) ownedJob.reference = next;
    },
    release(): void {
      if (subscriber.released) return;
      subscriber.released = true;
      ownedJob.subscribers.delete(subscriber);
      releaseViewport?.();
      if (ownedJob.state.src && ![...ownedJob.subscribers].some(({ element }) => element)) {
        URL.revokeObjectURL(ownedJob.state.src);
        ownedJob.state = { loading: false };
      }
      if (!ownedJob.subscribers.size) {
        if (ownedJob.request) {
          ownedJob.request.canceled = true;
          void queryClient.cancelQueries(
            { queryKey: options(ownedJob).queryKey, exact: true },
            { revert: true }
          );
          ownedJob.state = { loading: true };
        } else jobs.delete(key);
        ownedJob.releaseQuery?.();
        ownedJob.releaseQuery = undefined;
      }
      schedule();
    }
  };
}
