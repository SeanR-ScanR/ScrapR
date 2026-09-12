import { z } from 'zod';
import {
  type AnyEntity,
  AnyEntitySchema,
  type AnyPreview,
  createContextSchema,
  createResourceSchema,
  createUrlParseResultSchema,
  type DescriptorKind,
  DescriptorKindSchema,
  type DescriptorMetadata,
  DescriptorMetadataSchema,
  type DescriptorOf,
  type DescriptorOperation,
  DescriptorOperationSchema,
  type DescriptorPath,
  DescriptorPathSchema,
  type EntityOf,
  getParentPath,
  type ParentPath,
  type PreviewOf,
  PreviewSchemas,
  type Source,
  type Plugin,
  type UrlDiscoveryScope,
  UrlDiscoveryScopeSchema,
  type UrlDiscoveryResult,
  type UrlParseResult
} from '@shared/pluginTypes';

interface DescriptorTree extends Partial<Record<DescriptorKind, DescriptorTree>> {
  _do?: Partial<Record<DescriptorOperation, unknown>>;
}

type ContextOperations = DescriptorOf<DescriptorKind, DescriptorKind[]>['_do'];
const rootOrDescriptorPathSchema = z.union([z.tuple([]), DescriptorPathSchema]);
const parentsSchema = AnyEntitySchema.array();

export function resolveDescriptor(source: Source, path: DescriptorPath | [] = []): DescriptorTree {
  const parsedPath = rootOrDescriptorPathSchema.parse(path);
  let node: DescriptorTree = source.descriptors;
  for (const kind of parsedPath) {
    const child = Object.hasOwn(node, kind) ? node[kind] : undefined;
    if (!child) {
      throw new Error(
        `La source "${source.id}" ne prend pas en charge le chemin de ressources "${parsedPath.join('/')}".`
      );
    }
    node = child;
  }
  return node;
}

export function listDescriptors(source: Source, path: DescriptorPath | [] = []): DescriptorKind[] {
  const node = resolveDescriptor(source, path);
  return DescriptorKindSchema.options.filter(
    (kind) => Object.hasOwn(node, kind) && node[kind] !== undefined
  );
}

export function getDescriptorCapabilities(
  source: Source,
  path: DescriptorPath
): DescriptorOperation[] {
  const node = resolveDescriptor(source, DescriptorPathSchema.parse(path));
  return DescriptorOperationSchema.options.filter(
    (operation) => typeof node._do?.[operation] === 'function'
  );
}

export function extractDescriptorMetadata(
  source: Source,
  path: DescriptorPath
): DescriptorMetadata {
  const parsedPath = DescriptorPathSchema.parse(path);
  return DescriptorMetadataSchema.parse({
    kind: parsedPath[parsedPath.length - 1],
    operations: getDescriptorCapabilities(source, parsedPath)
  });
}

export function listDescriptorMetadata(
  source: Source,
  path: DescriptorPath | [] = []
): DescriptorMetadata[] {
  return listDescriptors(source, path).map((kind) =>
    extractDescriptorMetadata(source, DescriptorPathSchema.parse([...path, kind]))
  );
}

export function getDescriptorSuggestions<K extends DescriptorKind>(
  source: Source,
  kind: K
): Promise<PreviewOf<K>[]>;
export async function getDescriptorSuggestions(
  source: Source,
  kind: DescriptorKind
): Promise<AnyPreview[]> {
  kind = DescriptorKindSchema.parse(kind);
  const operation = resolveDescriptor(source, [kind])._do?.suggestions;
  if (typeof operation !== 'function') {
    throw new Error(
      `La source "${source.id}" ne propose pas de suggestions pour le type "${kind}".`
    );
  }
  const suggestions = operation as NonNullable<DescriptorOf['_do']['suggestions']>;
  return PreviewSchemas[kind].array().parse(await suggestions());
}

function resolveOperationContext(
  source: Source,
  inputParents: readonly AnyEntity[],
  inputKind: DescriptorKind
): {
  kind: DescriptorKind;
  parentPath: DescriptorKind[];
  context: Parameters<NonNullable<ContextOperations['get']>>[0];
  node: DescriptorTree;
} {
  const parents = parentsSchema.parse(inputParents);
  const kind = DescriptorKindSchema.parse(inputKind);
  const parentPath = getParentPath(parents);
  const node = resolveDescriptor(source, DescriptorPathSchema.parse([...parentPath, kind]));
  const context = createContextSchema(parentPath).parse({
    _parents: parents,
    ...Object.fromEntries(parents.map((parent) => [parent.kind, parent]))
  });
  return { kind, parentPath, context, node };
}

export function searchDescriptor<K extends DescriptorKind>(
  source: Source,
  parents: readonly AnyEntity[],
  kind: K,
  query: string
): Promise<PreviewOf<K>[]>;
export async function searchDescriptor(
  source: Source,
  parents: readonly AnyEntity[],
  kind: DescriptorKind,
  query: string
): Promise<AnyPreview[]> {
  const resolved = resolveOperationContext(source, parents, kind);
  query = z.string().parse(query);
  const operation = resolved.node._do?.search;
  if (typeof operation !== 'function') {
    throw new Error(
      `La source "${source.id}" ne permet pas la recherche pour le type "${resolved.kind}".`
    );
  }
  const search = operation as NonNullable<ContextOperations['search']>;
  return PreviewSchemas[resolved.kind].array().parse(await search(resolved.context, query));
}

export function getDescriptorResource<
  K extends DescriptorKind,
  const Parents extends readonly AnyEntity[]
>(source: Source, parents: Parents, kind: K, id: string): Promise<EntityOf<K, ParentPath<Parents>>>;
export async function getDescriptorResource(
  source: Source,
  parents: readonly AnyEntity[],
  kind: DescriptorKind,
  id: string
): Promise<AnyEntity> {
  const resolved = resolveOperationContext(source, parents, kind);
  id = z.string().parse(id);
  const operation = resolved.node._do?.get;
  if (typeof operation !== 'function') {
    throw new Error(
      `La source "${source.id}" ne permet pas de récupérer les ressources de type "${resolved.kind}".`
    );
  }
  const get = operation as NonNullable<ContextOperations['get']>;
  return createResourceSchema(resolved.kind, parents).parse(await get(resolved.context, id));
}

export async function parseDescriptorUrl(
  source: Source,
  path: DescriptorPath,
  url: URL
): Promise<UrlParseResult> {
  path = DescriptorPathSchema.parse(path);
  url = z.instanceof(URL).parse(url);
  const operation = resolveDescriptor(source, path)._do?.parseUrl;
  if (typeof operation !== 'function') {
    throw new Error(`Source "${source.id}" cannot parse URLs for "${path.join('/')}".`);
  }
  const parseUrl = operation as NonNullable<ContextOperations['parseUrl']>;
  return createUrlParseResultSchema(path).parse(await parseUrl(url));
}

export async function discoverDescriptorUrl(
  plugins: readonly Plugin[],
  url: URL,
  scope?: UrlDiscoveryScope
): Promise<UrlDiscoveryResult> {
  url = z.instanceof(URL).parse(url);
  scope = UrlDiscoveryScopeSchema.optional().parse(scope);
  const result: UrlDiscoveryResult = { matches: [], errors: [] };
  const selectedPlugins = plugins.filter((plugin) => !scope || plugin.id === scope.pluginId);
  if (scope && selectedPlugins.length !== 1) {
    result.errors.push(`Plugin "${scope.pluginId}" was not found or is ambiguous.`);
    return result;
  }
  for (const plugin of selectedPlugins) {
    const sources = (plugin.sources ?? []).filter(
      (source) => !scope?.sourceId || source.id === scope.sourceId
    );
    if (scope?.sourceId && sources.length !== 1) {
      result.errors.push(`Source "${plugin.id}/${scope.sourceId}" was not found or is ambiguous.`);
      continue;
    }
    for (const source of sources) {
      async function visit(path: DescriptorPath | []): Promise<void> {
        for (const kind of listDescriptors(source, path)) {
          const childPath = DescriptorPathSchema.parse([...path, kind]);
          const operation = resolveDescriptor(source, childPath)._do?.canParseUrl;
          if (typeof operation === 'function') {
            try {
              const canParseUrl = operation as NonNullable<ContextOperations['canParseUrl']>;
              if (z.boolean().parse(await canParseUrl(new URL(url.href)))) {
                result.matches.push({
                  pluginId: plugin.id,
                  sourceId: source.id,
                  pluginName: plugin.name,
                  sourceName: source.name,
                  path: childPath
                });
              }
            } catch (error) {
              result.errors.push(
                `${plugin.id}/${source.id}/${childPath.join('/')}: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
            }
          }
          await visit(childPath);
        }
      }
      await visit([]);
    }
  }
  result.matches = result.matches.filter(
    (match) =>
      !result.matches.some(
        (child) =>
          child.pluginId === match.pluginId &&
          child.sourceId === match.sourceId &&
          child.path.length > match.path.length &&
          match.path.every((kind, index) => child.path[index] === kind)
      )
  );
  return result;
}
