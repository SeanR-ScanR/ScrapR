import { PluginMetadataSchema, type PluginMetadata } from '@shared/pluginTypes';

export function extractSourceMetadata(source: unknown): PluginMetadata {
  return PluginMetadataSchema.parse(source);
}
