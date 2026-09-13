import {
  DescriptorKindSchema,
  DescriptorPathSchema,
  type AnyEntity,
  type DescriptorKind,
  type DescriptorPath
} from '@shared/pluginTypes';
import { queryOptions, type QueryClient } from '@tanstack/react-query';
import {
  ResourceReferenceSchema,
  ResourceOriginSchema,
  type ResourceReference
} from '@shared/favoriteTypes';
import { descriptorQueries } from './ipcQueries';

export type { ResourceReference } from '@shared/favoriteTypes';

export interface ExploreSearch {
  kind?: DescriptorKind;
  query?: string;
  resource?: ResourceReference[];
  origin?: { url: string; path: DescriptorPath };
}

export function validateExploreSearch(search: Record<string, unknown>): ExploreSearch {
  const kind = DescriptorKindSchema.safeParse(search.kind);
  const resource =
    search.resource === undefined
      ? undefined
      : ResourceReferenceSchema.array().nonempty().parse(search.resource);
  if (resource) DescriptorPathSchema.parse(resource.map((entry) => entry.kind));
  if (resource && kind.success && resource[0].kind !== kind.data) {
    throw new Error('The resource path does not match the selected descriptor.');
  }
  return {
    ...(resource ? { kind: resource[0].kind } : kind.success ? { kind: kind.data } : {}),
    ...(typeof search.query === 'string' && search.query ? { query: search.query } : {}),
    ...(resource ? { resource } : {}),
    ...(resource && search.origin !== undefined
      ? { origin: ResourceOriginSchema.parse(search.origin) }
      : {})
  };
}

export function resourcePathQuery(
  queryClient: QueryClient,
  pluginId: string,
  sourceId: string,
  references: readonly ResourceReference[],
  origin?: ExploreSearch['origin']
) {
  return queryOptions({
    queryKey: ['resource-path', pluginId, sourceId, references, origin] as const,
    queryFn: async ({ signal }): Promise<AnyEntity[]> => {
      const parents: AnyEntity[] = [];
      if (origin) {
        const parsed = await queryClient.query(
          descriptorQueries.parseUrl(pluginId, sourceId, origin.path, origin.url)
        );
        signal.throwIfAborted();
        for (const entity of [...parsed.parents, parsed.entity]) {
          const reference = references[parents.length];
          if (reference?.kind !== entity.kind || reference.id !== entity.id) break;
          parents.push(entity);
        }
      }
      for (const reference of references.slice(parents.length)) {
        signal.throwIfAborted();
        const entity = await queryClient.query(
          descriptorQueries.get(pluginId, sourceId, [...parents], reference.kind, reference.id)
        );
        signal.throwIfAborted();
        parents.push(entity);
      }
      return parents;
    }
  });
}
