import { Plugin, PluginMetadata, PluginMetadataSchema } from '@shared/pluginTypes';
import { extractSourceMetadata } from './sourceUtils';

export function resolvePlugin(pluginId: Plugin['id'], plugins: readonly Plugin[]): Plugin {
  const matches = plugins.filter((plugin) => plugin.id === pluginId);
  if (matches.length !== 1)
    throw new Error(`Plugin "${pluginId}" was not found or its ID is ambiguous.`);
  return matches[0];
}

export function extractPluginMetadata(plugin: Plugin): PluginMetadata {
  const metadata: PluginMetadata = {
    id: plugin.id,
    name: plugin.name,
    sources: (plugin.sources ?? []).map(extractSourceMetadata)
  };
  return PluginMetadataSchema.parse(metadata);
}
