import internalPluginRepository from '../plugins/internalPluginRepository';
import { extractPluginMetadata } from '../utils/pluginUtils';
import { handle } from './handle';

export function registerPluginHandlers(): void {
  handle('plugin:list', () => {
    return internalPluginRepository.map(extractPluginMetadata);
  });
}
