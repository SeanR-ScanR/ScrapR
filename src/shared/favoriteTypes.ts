import { z } from 'zod';
import { AnyEntitySchema, DescriptorKindSchema, DescriptorPathSchema } from './pluginTypes';

export const ResourceReferenceSchema = z.strictObject({
  kind: DescriptorKindSchema,
  id: z.string()
});
export type ResourceReference = z.infer<typeof ResourceReferenceSchema>;

export const ResourceOriginSchema = z.strictObject({
  url: z.url({ protocol: /^https?$/ }),
  path: DescriptorPathSchema
});

export const FavoriteThumbnailSchema = z
  .strictObject({
    key: z
      .string()
      .min(1)
      .refine((key) => !/^\s*(?:data|blob):/i.test(key), {
        message: 'Favorite thumbnail keys must be reloadable, not data or blob URIs'
      }),
    payload: z.json()
  })
  .refine((thumbnail) => new TextEncoder().encode(JSON.stringify(thumbnail)).byteLength <= 65536, {
    message: 'Favorite thumbnail metadata must not exceed 64 KiB'
  });

export const FavoriteIdentitySchema = z.object({
  pluginId: z.string().min(1),
  sourceId: z.string().min(1),
  resource: ResourceReferenceSchema.array()
    .nonempty()
    .refine(
      (resource) => DescriptorPathSchema.safeParse(resource.map(({ kind }) => kind)).success,
      {
        message: 'Favorite resource must follow a valid descriptor path'
      }
    )
});
export type FavoriteIdentity = z.infer<typeof FavoriteIdentitySchema>;

export const FavoriteInputSchema = z.strictObject({
  pluginId: z.string().min(1),
  sourceId: z.string().min(1),
  parents: AnyEntitySchema.array().readonly(),
  kind: DescriptorKindSchema,
  id: z.string(),
  origin: ResourceOriginSchema.optional()
});
export type FavoriteInput = z.infer<typeof FavoriteInputSchema>;

export const FavoriteSchema = FavoriteIdentitySchema.extend({
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  thumbnail: FavoriteThumbnailSchema.optional(),
  origin: ResourceOriginSchema.optional(),
  addedAt: z.number().int().nonnegative(),
  aliases: FavoriteIdentitySchema.shape.resource.array().nonempty()
}).refine(
  ({ resource, aliases }) =>
    aliases.every(
      (alias) =>
        alias.length === resource.length &&
        alias.every(({ kind }, index) => kind === resource[index].kind)
    ),
  { message: 'Favorite aliases must match the canonical descriptor path', path: ['aliases'] }
);
export type Favorite = z.infer<typeof FavoriteSchema>;

export function favoriteKey({ pluginId, sourceId, resource }: FavoriteIdentity): string {
  return JSON.stringify([pluginId, sourceId, resource.map(({ kind, id }) => [kind, id])]);
}
