import internalPluginRepository from '../plugins/internalPluginRepository';
import { extractSourceMetadata, listSources, resolveSource } from '../utils/sourceUtils';
import {
  getDescriptorCapabilities,
  getDescriptorResource,
  getDescriptorSuggestions,
  listDescriptorMetadata,
  parseDescriptorUrl,
  searchDescriptor
} from '../utils/descriptorUtils';
import { handle } from './handle';

export function registerSourceHandlers(): void {
  handle('plugin.source:list', (pluginId) =>
    listSources(pluginId, internalPluginRepository).map(extractSourceMetadata)
  );
  handle('plugin.source:get', (pluginId, sourceId) =>
    extractSourceMetadata(resolveSource(pluginId, sourceId, internalPluginRepository))
  );
  handle('plugin.source.descriptor:list', (pluginId, sourceId, path) =>
    listDescriptorMetadata(resolveSource(pluginId, sourceId, internalPluginRepository), path)
  );
  handle('plugin.source.descriptor:capabilities', (pluginId, sourceId, path) =>
    getDescriptorCapabilities(resolveSource(pluginId, sourceId, internalPluginRepository), path)
  );
  handle('plugin.source.descriptor.resource:suggestions', (pluginId, sourceId, kind) =>
    getDescriptorSuggestions(resolveSource(pluginId, sourceId, internalPluginRepository), kind)
  );
  handle('plugin.source.descriptor.resource:search', (pluginId, sourceId, parents, kind, query) =>
    searchDescriptor(
      resolveSource(pluginId, sourceId, internalPluginRepository),
      parents,
      kind,
      query
    )
  );
  handle('plugin.source.descriptor.resource:get', (pluginId, sourceId, parents, kind, id) =>
    getDescriptorResource(
      resolveSource(pluginId, sourceId, internalPluginRepository),
      parents,
      kind,
      id
    )
  );
  handle('plugin.source.descriptor.resource:parseUrl', (pluginId, sourceId, parents, kind, url) =>
    parseDescriptorUrl(
      resolveSource(pluginId, sourceId, internalPluginRepository),
      parents,
      kind,
      new URL(url)
    )
  );
}
