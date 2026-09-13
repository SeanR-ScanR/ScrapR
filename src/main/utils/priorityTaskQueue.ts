import { AsyncQueuer } from '@tanstack/pacer';

type QueuedTask = {
  priority: number;
  run: () => Promise<void>;
  reject: (error: unknown) => void;
};

export class PriorityTaskQueue {
  private readonly queue: AsyncQueuer<QueuedTask>;
  private readonly defaultPriority: number;

  constructor({
    concurrency = 1,
    defaultPriority = 0
  }: { concurrency?: number; defaultPriority?: number } = {}) {
    if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
      throw new RangeError('Concurrency must be a positive safe integer');
    }
    this.defaultPriority = defaultPriority;
    // Pacer swallows AbortError before onError. Settle callers separately and
    // return void so Pacer's lastResult never retains task results.
    this.queue = new AsyncQueuer<QueuedTask>((request) => request.run().catch(request.reject), {
      concurrency,
      asyncRetryerOptions: { maxAttempts: 1 },
      onError: (error, request) => request.reject(error),
      throwOnError: false
    });
  }

  run<T>(
    task: () => Promise<T>,
    {
      signal,
      priority
    }: {
      signal?: AbortSignal;
      priority?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> & {
        readonly value: number;
      };
    } = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      const detachPendingListeners = (): void => {
        signal?.removeEventListener('abort', cancelPendingTask);
        priority?.removeEventListener('change', reorderPendingTask);
      };
      const reorderPendingTask = (): void => {
        const pending = this.queue.peekPendingItems();
        if (!pending.includes(request)) return;
        request.priority = priority?.value ?? this.defaultPriority;
        this.rebuildPendingQueue(pending);
      };
      const cancelPendingTask = (): void => {
        const pending = this.queue.peekPendingItems();
        if (!pending.includes(request)) return;
        request.reject(signal?.reason);
        this.rebuildPendingQueue(pending.filter((item) => item !== request));
      };
      const request: QueuedTask = {
        priority: priority?.value ?? this.defaultPriority,
        reject: (error) => {
          detachPendingListeners();
          reject(error);
        },
        run: async () => {
          // Active tasks own cancellation; wait for them to unwind before settling.
          detachPendingListeners();
          signal?.throwIfAborted();
          const result = await task();
          signal?.throwIfAborted();
          resolve(result);
        }
      };

      signal?.addEventListener('abort', cancelPendingTask, { once: true });
      priority?.addEventListener('change', reorderPendingTask);
      // Wake processing on every submission: Pacer's pending tick can otherwise
      // leave free slots idle until a previous task completes. Active work is untouched.
      this.queue.stop();
      try {
        this.queue.addItem(request);
      } catch (error) {
        request.reject(error);
      } finally {
        this.queue.start();
      }
    });
  }

  private rebuildPendingQueue(pending: QueuedTask[]): void {
    // Pacer has no per-item removal/reprioritization API. Reinsert while stopped
    // without disturbing active tasks or their concurrency accounting.
    this.queue.stop();
    try {
      this.queue.clear();
      for (const request of pending) this.queue.addItem(request);
    } finally {
      this.queue.start();
    }
  }
}
