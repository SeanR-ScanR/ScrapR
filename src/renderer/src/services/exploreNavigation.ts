import {
  DescriptorKindSchema,
  type AnyEntity,
  type DescriptorKind,
  type DescriptorMetadata,
  type UrlParseResult
} from '@shared/pluginTypes';

export interface ExploreSearch {
  kind?: DescriptorKind;
  query?: string;
  resource?: string;
}

export function validateExploreSearch(search: Record<string, unknown>): ExploreSearch {
  const kind = DescriptorKindSchema.safeParse(search.kind);
  return {
    ...(kind.success ? { kind: kind.data } : {}),
    ...(typeof search.query === 'string' && search.query ? { query: search.query } : {}),
    ...(typeof search.resource === 'string' && search.resource ? { resource: search.resource } : {})
  };
}

export interface ResourceFrame {
  entity: AnyEntity;
  children?: DescriptorMetadata[];
}

// Session snapshots deliberately keep entities (including page data) out of URLs.
const resources = new Map<
  string,
  { pluginId: string; sourceId: string; frames: ResourceFrame[] }
>();

export function cacheResourcePath(
  pluginId: string,
  sourceId: string,
  frames: ResourceFrame[]
): string {
  const token = crypto.randomUUID();
  resources.set(token, { pluginId, sourceId, frames: structuredClone(frames) });
  return token;
}

export function cacheParsedResource(
  pluginId: string,
  sourceId: string,
  result: UrlParseResult
): string {
  return cacheResourcePath(
    pluginId,
    sourceId,
    [...result.parents, result.entity].map((entity) => ({ entity }))
  );
}

export function getResourcePath(
  pluginId: string,
  sourceId: string,
  token: string
): ResourceFrame[] | undefined {
  const snapshot = resources.get(token);
  return snapshot?.pluginId === pluginId && snapshot.sourceId === sourceId
    ? snapshot.frames
    : undefined;
}
