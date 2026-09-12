import { queryOptions } from '@tanstack/react-query';
import type { AnyEntity, DescriptorKind } from '@shared/pluginTypes';
import { descriptorClient } from './descriptorClient';
import { repositoryClient } from './repositoryClient';

// Include every IPC argument: plugins can use the full parent entities as context.
export const repositoryQueries = {
  listPlugins: () =>
    queryOptions({
      queryKey: ['ipc', 'plugin:list'] as const,
      queryFn: () => repositoryClient.listPlugins()
    }),
  listSources: (...args: Parameters<typeof repositoryClient.listSources>) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source:list', ...args] as const,
      queryFn: () => repositoryClient.listSources(...args)
    }),
  getSource: (...args: Parameters<typeof repositoryClient.getSource>) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source:get', ...args] as const,
      queryFn: () => repositoryClient.getSource(...args)
    })
};

export const descriptorQueries = {
  list: (pluginId: string, sourceId: string, ancestors: DescriptorKind[] = []) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source.descriptor:list', pluginId, sourceId, ancestors] as const,
      queryFn: () => descriptorClient.list(pluginId, sourceId, ancestors)
    }),
  capabilities: (...args: Parameters<typeof descriptorClient.capabilities>) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source.descriptor:capabilities', ...args] as const,
      queryFn: () => descriptorClient.capabilities(...args)
    }),
  suggestions: <K extends DescriptorKind>(pluginId: string, sourceId: string, kind: K) =>
    queryOptions({
      queryKey: [
        'ipc',
        'plugin.source.descriptor.resource:suggestions',
        pluginId,
        sourceId,
        kind
      ] as const,
      queryFn: () => descriptorClient.suggestions(pluginId, sourceId, kind)
    }),
  search: <K extends DescriptorKind>(
    pluginId: string,
    sourceId: string,
    parents: readonly AnyEntity[],
    kind: K,
    query: string
  ) =>
    queryOptions({
      queryKey: [
        'ipc',
        'plugin.source.descriptor.resource:search',
        pluginId,
        sourceId,
        parents,
        kind,
        query
      ] as const,
      queryFn: () => descriptorClient.search(pluginId, sourceId, parents, kind, query)
    }),
  get: <K extends DescriptorKind, const Parents extends readonly AnyEntity[]>(
    pluginId: string,
    sourceId: string,
    parents: Parents,
    kind: K,
    id: string
  ) =>
    queryOptions({
      queryKey: [
        'ipc',
        'plugin.source.descriptor.resource:get',
        pluginId,
        sourceId,
        parents,
        kind,
        id
      ] as const,
      queryFn: () => descriptorClient.get(pluginId, sourceId, parents, kind, id)
    }),
  parseUrl: (...args: Parameters<typeof descriptorClient.parseUrl>) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source.descriptor.resource:parseUrl', ...args] as const,
      queryFn: () => descriptorClient.parseUrl(...args)
    }),
  discoverUrl: (...args: Parameters<typeof descriptorClient.discoverUrl>) =>
    queryOptions({
      queryKey: ['ipc', 'plugin.source.descriptor.resource:discoverUrl', ...args] as const,
      queryFn: () => descriptorClient.discoverUrl(...args)
    })
};
