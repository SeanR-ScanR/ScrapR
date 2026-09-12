import type { PluginMetadata, SourceMetadata } from '@shared/pluginTypes';
import { invoke } from './ipcClient';

export const repositoryClient = {
  listSources(pluginId: string): Promise<SourceMetadata[]> {
    return invoke('plugin.source:list', pluginId);
  },

  listPlugins(): Promise<PluginMetadata[]> {
    return invoke('plugin:list');
  },

  getSource(pluginId: string, sourceId: string): Promise<SourceMetadata> {
    return invoke('plugin.source:get', pluginId, sourceId);
  }
};
