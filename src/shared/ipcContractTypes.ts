import { z } from 'zod';
import { FavoriteIdentitySchema, FavoriteInputSchema, FavoriteSchema } from './favoriteTypes';
import {
  AnyEntitySchema,
  createResourceSchema,
  createUrlParseResultSchema,
  DescriptorKindSchema,
  DescriptorMetadataSchema,
  DescriptorOperationSchema,
  DescriptorPathSchema,
  PluginMetadataSchema,
  PreviewSchemas,
  SourceMetadataSchema,
  ThumbnailDataSchema,
  ThumbnailMetadataSchema,
  UrlDiscoveryScopeSchema,
  UrlDiscoveryResultSchema
} from './pluginTypes';

const pluginId = PluginMetadataSchema.shape.id;
const sourceId = SourceMetadataSchema.shape.id;
const parents = AnyEntitySchema.array().readonly();
const ancestorPath = z.union([z.tuple([]), DescriptorPathSchema]);
const resourceInput = z.tuple([pluginId, sourceId, parents, DescriptorKindSchema, z.string()]);

function contract<Input extends z.ZodType<unknown[]>, Output extends z.ZodType>(
  input: Input,
  output: (args: z.output<Input>) => Output
): {
  input: Input;
  output: (args: z.output<Input>) => Output;
  parseResult: (args: unknown, result: unknown) => z.output<Output>;
} {
  return {
    input,
    output,
    parseResult: (args, result) => output(input.parse(args)).parse(result)
  };
}

export const IpcContracts = {
  'favorites:list': contract(z.tuple([]), () => FavoriteSchema.array()),
  'favorites:add': contract(z.tuple([FavoriteInputSchema]), () => FavoriteSchema.array()),
  'favorites:remove': contract(z.tuple([FavoriteIdentitySchema]), () => FavoriteSchema.array()),
  'plugin:list': contract(z.tuple([]), () => PluginMetadataSchema.array()),
  'plugin.source:list': contract(z.tuple([pluginId]), () => SourceMetadataSchema.array()),
  'plugin.source:get': contract(z.tuple([pluginId, sourceId]), () => SourceMetadataSchema),
  'plugin.source.descriptor.thumbnail:load': contract(
    z.tuple([
      pluginId,
      sourceId,
      DescriptorPathSchema,
      z.string(),
      ThumbnailMetadataSchema,
      z.number()
    ]),
    () => z.union([ThumbnailDataSchema, z.strictObject({ canceled: z.literal(true) })])
  ),
  'plugin.source.descriptor.thumbnail:cancel': contract(z.tuple([z.string()]), () => z.void()),
  'plugin.source.descriptor.thumbnail:priority': contract(z.tuple([z.string(), z.number()]), () =>
    z.void()
  ),
  'plugin.source.descriptor:list': contract(z.tuple([pluginId, sourceId, ancestorPath]), () =>
    DescriptorMetadataSchema.array()
  ),
  'plugin.source.descriptor:capabilities': contract(
    z.tuple([pluginId, sourceId, DescriptorPathSchema]),
    () => DescriptorOperationSchema.array()
  ),
  'plugin.source.descriptor.resource:suggestions': contract(
    z.tuple([pluginId, sourceId, DescriptorKindSchema]),
    ([, , kind]) => z.array(PreviewSchemas[kind])
  ),
  'plugin.source.descriptor.resource:search': contract(resourceInput, ([, , , kind]) =>
    z.array(PreviewSchemas[kind])
  ),
  'plugin.source.descriptor.resource:get': contract(resourceInput, ([, , parents, kind]) =>
    createResourceSchema(kind, parents)
  ),
  'plugin.source.descriptor.resource:discoverUrl': contract(
    z.tuple([z.url(), UrlDiscoveryScopeSchema.optional()]),
    () => UrlDiscoveryResultSchema
  ),
  'plugin.source.descriptor.resource:parseUrl': contract(
    z.tuple([pluginId, sourceId, DescriptorPathSchema, z.url()]),
    ([, , path]) => createUrlParseResultSchema(path)
  )
};

export type IpcChannel = keyof typeof IpcContracts;
export type IpcArguments<Channel extends IpcChannel> = z.input<
  (typeof IpcContracts)[Channel]['input']
>;

export type IpcResult<Channel extends IpcChannel> = ReturnType<
  (typeof IpcContracts)[Channel]['parseResult']
>;

export type IpcHandler<Channel extends IpcChannel> = (
  ...args: z.output<(typeof IpcContracts)[Channel]['input']>
) => IpcResult<Channel> | Promise<IpcResult<Channel>>;
