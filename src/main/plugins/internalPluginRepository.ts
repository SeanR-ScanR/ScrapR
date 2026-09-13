import ynjnPlugin from './ynjnPlugin';
import comicDaysPlugin from './comicDaysPlugin';
import { type Plugin, PluginSchema } from '@shared/pluginTypes';

const plugins: Plugin[] = [ynjnPlugin, comicDaysPlugin].map((plugin) => PluginSchema.parse(plugin));

export default plugins;
