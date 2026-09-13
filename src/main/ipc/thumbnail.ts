import { ipcMain, type WebContents } from 'electron';
import { IpcContracts } from '@shared/ipcContractTypes';
import { ThumbnailPriority } from '@shared/pluginTypes';
import internalPluginRepository from '../plugins/internalPluginRepository';
import { resolveDescriptor } from '../utils/descriptorUtils';
import { resolveSource } from '../utils/sourceUtils';

type ActiveRequest = {
  controller: AbortController;
  settled: Promise<void>;
  frameTreeNodeId: number;
  priority: ThumbnailPriority;
};

export function registerThumbnailHandlers(): void {
  const active = new Map<
    WebContents,
    {
      requests: Map<string, ActiveRequest>;
      dispose: () => void;
    }
  >();
  const loadContract = IpcContracts['plugin.source.descriptor.thumbnail:load'];
  const cancelContract = IpcContracts['plugin.source.descriptor.thumbnail:cancel'];
  const priorityContract = IpcContracts['plugin.source.descriptor.thumbnail:priority'];

  ipcMain.handle('plugin.source.descriptor.thumbnail:load', async (event, ...args: unknown[]) => {
    const input = loadContract.input.parse(args);
    const [pluginId, sourceId, path, requestId, reference, initialPriority] = input;
    const { sender, senderFrame } = event;
    if (sender.isDestroyed() || !senderFrame || senderFrame.isDestroyed() || senderFrame.detached) {
      throw new Error('Thumbnail requesting frame is unavailable.');
    }
    const source = resolveSource(pluginId, sourceId, internalPluginRepository);
    const operations = resolveDescriptor(source, path)._do;
    if (typeof operations?.loadThumbnail !== 'function') {
      throw new Error(`Descriptor "${path.join('/')}" does not support thumbnails.`);
    }

    let owner = active.get(sender);
    if (!owner) {
      const requests = new Map<string, ActiveRequest>();
      const dispose = (): void => {
        sender.removeListener('destroyed', abortAll);
        sender.removeListener('render-process-gone', abortAll);
        sender.removeListener('did-start-navigation', onNavigation);
        if (active.get(sender)?.requests === requests) active.delete(sender);
      };
      const abortAll = (): void => {
        // Keep aborted work active until finally so IDs and cancellation acknowledgments stay honest.
        for (const request of requests.values()) request.controller.abort();
      };
      const onNavigation = (details: Electron.WebContentsDidStartNavigationEventParams): void => {
        if (details.isSameDocument) return;
        if (details.isMainFrame) {
          abortAll();
          return;
        }
        const frames = new Set(
          details.frame?.framesInSubtree.map((frame) => frame.frameTreeNodeId)
        );
        for (const request of requests.values()) {
          if (frames.has(request.frameTreeNodeId)) request.controller.abort();
        }
      };
      owner = { requests, dispose };
      active.set(sender, owner);
      sender.on('destroyed', abortAll);
      sender.on('render-process-gone', abortAll);
      sender.on('did-start-navigation', onNavigation);
    }

    const key = JSON.stringify([event.processId, event.frameId, requestId]);
    if (owner.requests.has(key)) throw new Error('Thumbnail request ID is already active.');
    const controller = new AbortController();
    const settled = Promise.withResolvers<void>();
    const priority = new ThumbnailPriority(initialPriority);
    owner.requests.set(key, {
      controller,
      priority,
      settled: settled.promise,
      frameTreeNodeId: senderFrame.frameTreeNodeId
    });
    try {
      const result = await operations.loadThumbnail(reference.payload, {
        signal: controller.signal,
        priority
      });
      controller.signal.throwIfAborted();
      return loadContract.parseResult(input, result);
    } catch (error) {
      // Expected scheduler/navigation cancellation must not reject Electron's IPC handler.
      if (controller.signal.aborted) {
        return loadContract.parseResult(input, { canceled: true });
      }
      throw error;
    } finally {
      owner.requests.delete(key);
      if (owner.requests.size === 0) owner.dispose();
      settled.resolve();
    }
  });

  ipcMain.handle('plugin.source.descriptor.thumbnail:cancel', async (event, ...args: unknown[]) => {
    const input = cancelContract.input.parse(args);
    const [requestId] = input;
    const key = JSON.stringify([event.processId, event.frameId, requestId]);
    const request = active.get(event.sender)?.requests.get(key);
    if (request) {
      request.controller.abort();
      // Aborting is cooperative: acknowledge completion only after the loader settles.
      await request.settled;
    }
    return cancelContract.parseResult(input, undefined);
  });

  ipcMain.handle('plugin.source.descriptor.thumbnail:priority', (event, ...args: unknown[]) => {
    const input = priorityContract.input.parse(args);
    const [requestId, value] = input;
    const key = JSON.stringify([event.processId, event.frameId, requestId]);
    active.get(event.sender)?.requests.get(key)?.priority.update(value);
    return priorityContract.parseResult(input, undefined);
  });
}
