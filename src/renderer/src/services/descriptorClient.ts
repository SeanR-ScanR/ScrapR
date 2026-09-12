import type {
  AnyEntity,
  AnyPreview,
  DescriptorKind,
  DescriptorMetadata,
  DescriptorOperation,
  DescriptorPath,
  EntityOf,
  ParentPath,
  PreviewOf,
  UrlDiscoveryScope,
  UrlDiscoveryResult,
  UrlParseResult
} from '@shared/pluginTypes';
import { invoke } from './ipcClient';

function list(
  pluginId: string,
  sourceId: string,
  ancestors: DescriptorKind[] = []
): Promise<DescriptorMetadata[]> {
  return invoke('plugin.source.descriptor:list', pluginId, sourceId, ancestors);
}

function capabilities(
  pluginId: string,
  sourceId: string,
  path: DescriptorPath
): Promise<DescriptorOperation[]> {
  return invoke('plugin.source.descriptor:capabilities', pluginId, sourceId, path);
}

function suggestions<K extends DescriptorKind>(
  pluginId: string,
  sourceId: string,
  kind: K
): Promise<PreviewOf<K>[]>;
function suggestions(
  pluginId: string,
  sourceId: string,
  kind: DescriptorKind
): Promise<AnyPreview[]> {
  return invoke('plugin.source.descriptor.resource:suggestions', pluginId, sourceId, kind);
}

function search<K extends DescriptorKind>(
  pluginId: string,
  sourceId: string,
  parents: readonly AnyEntity[],
  kind: K,
  query: string
): Promise<PreviewOf<K>[]>;
function search(
  pluginId: string,
  sourceId: string,
  parents: readonly AnyEntity[],
  kind: DescriptorKind,
  query: string
): Promise<AnyPreview[]> {
  return invoke(
    'plugin.source.descriptor.resource:search',
    pluginId,
    sourceId,
    parents,
    kind,
    query
  );
}

function get<K extends DescriptorKind, const Parents extends readonly AnyEntity[]>(
  pluginId: string,
  sourceId: string,
  parents: Parents,
  kind: K,
  id: string
): Promise<EntityOf<K, ParentPath<Parents>>>;
function get(
  pluginId: string,
  sourceId: string,
  parents: readonly AnyEntity[],
  kind: DescriptorKind,
  id: string
): Promise<AnyEntity> {
  return invoke('plugin.source.descriptor.resource:get', pluginId, sourceId, parents, kind, id);
}

function parseUrl(
  pluginId: string,
  sourceId: string,
  path: DescriptorPath,
  url: string
): Promise<UrlParseResult> {
  return invoke('plugin.source.descriptor.resource:parseUrl', pluginId, sourceId, path, url);
}

function discoverUrl(url: string, scope?: UrlDiscoveryScope): Promise<UrlDiscoveryResult> {
  return invoke('plugin.source.descriptor.resource:discoverUrl', url, scope);
}

export const descriptorClient = {
  list,
  capabilities,
  suggestions,
  search,
  get,
  parseUrl,
  discoverUrl
};
