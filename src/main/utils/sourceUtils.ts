import {
  type Plugin,
  type Source,
  type SourceMetadata,
  SourceMetadataSchema
} from '@shared/pluginTypes';
import { listDescriptorMetadata } from './descriptorUtils';
import { resolvePlugin } from './pluginUtils';

export function extractSourceMetadata(source: Source): SourceMetadata {
  const metadata: SourceMetadata = {
    id: source.id,
    name: source.name,
    language: source.language,
    descriptors: listDescriptorMetadata(source)
  };
  return SourceMetadataSchema.parse(metadata);
}

export function listSources(pluginId: Plugin['id'], plugins: readonly Plugin[]): Source[] {
  return resolvePlugin(pluginId, plugins).sources ?? [];
}

export function resolveSource(
  pluginId: Plugin['id'],
  sourceId: Source['id'],
  plugins: readonly Plugin[]
): Source {
  const matches = listSources(pluginId, plugins).filter((source) => source.id === sourceId);
  const source = matches[0];
  if (!source) throw new Error(`La source « ${sourceId} » est introuvable.`);
  if (matches.length > 1) throw new Error(`L’identifiant de source « ${sourceId} » est ambigu.`);
  return source;
}
