import { Plugin, PluginMetadata } from '@shared/pluginTypes';

export function extractSourceMetadata(source: Plugin): PluginMetadata {
 return {name: source.name, language: source.language};
}
