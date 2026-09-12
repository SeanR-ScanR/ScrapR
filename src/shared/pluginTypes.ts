import ISO6391 from 'iso-639-1';
import { z } from 'zod';

export const Descriptors = {
  MAGAZINE: 'magazine',
  RELEASE: 'release',
  SERIES: 'series',
  CHAPTER: 'chapter',
  PAGE: 'page'
} as const;

export const KindSchema = z.enum(Descriptors);
export type Kind = z.infer<typeof KindSchema>;

export const MagazinePreviewSchema = z.object({
  kind: z.literal(Descriptors.MAGAZINE),
  id: z.string(),
  title: z.string()
});
export const ReleasePreviewSchema = MagazinePreviewSchema.extend({
  kind: z.literal(Descriptors.RELEASE),
  date: z.string()
});
export const SeriesPreviewSchema = MagazinePreviewSchema.extend({
  kind: z.literal(Descriptors.SERIES)
});
export const ChapterPreviewSchema = MagazinePreviewSchema.extend({
  kind: z.literal(Descriptors.CHAPTER)
});
export const PagePreviewSchema = z.object({
  kind: z.literal(Descriptors.PAGE),
  id: z.string()
});

export type MagazinePreview = z.infer<typeof MagazinePreviewSchema>;
export type ReleasePreview = z.infer<typeof ReleasePreviewSchema>;
export type SeriesPreview = z.infer<typeof SeriesPreviewSchema>;
export type ChapterPreview = z.infer<typeof ChapterPreviewSchema>;
export type PagePreview = z.infer<typeof PagePreviewSchema>;

const previewSchemas = {
  magazine: MagazinePreviewSchema,
  release: ReleasePreviewSchema,
  series: SeriesPreviewSchema,
  chapter: ChapterPreviewSchema,
  page: PagePreviewSchema
};
const entityBaseSchemas = {
  magazine: MagazinePreviewSchema.extend({ description: z.string() }),
  release: ReleasePreviewSchema.extend({ description: z.string() }),
  series: SeriesPreviewSchema.extend({ description: z.string() }),
  chapter: ChapterPreviewSchema.extend({ description: z.string() }),
  page: PagePreviewSchema.extend({ dataUri: z.string() })
};

type ChildKinds<This extends Kind, Path extends readonly Kind[]> = Exclude<
  Kind,
  This | Path[number]
>;
type PreviewShape<Keys extends Kind> = {
  [K in Keys]: z.ZodOptional<z.ZodArray<(typeof previewSchemas)[K]>>;
};

function createPreviewShape<Keys extends Kind>(kinds: readonly Keys[]): PreviewShape<Keys> {
  return Object.fromEntries(
    kinds.map((kind) => [kind, previewSchemas[kind].array().optional()])
  ) as PreviewShape<Keys>;
}

export const SuggestionsSchema = z.strictObject(createPreviewShape(KindSchema.options));
export type Suggestions = z.infer<typeof SuggestionsSchema>;

type EntityShape<
  This extends Kind,
  Path extends readonly Kind[]
> = (typeof entityBaseSchemas)[This]['shape'] &
  (This extends typeof Descriptors.PAGE
    ? Record<never, never>
    : { has: z.ZodOptional<z.ZodObject<PreviewShape<ChildKinds<This, Path>>>> });

export function createEntitySchema<This extends Kind, const Path extends readonly Kind[] = []>(
  kind: This,
  path: Path = [] as unknown as Path
): z.ZodObject<EntityShape<This, Path>> {
  const children = KindSchema.options.filter(
    (child) => child !== kind && !path.includes(child)
  ) as ChildKinds<This, Path>[];
  return z.strictObject({
    ...entityBaseSchemas[kind].shape,
    ...(kind === Descriptors.PAGE
      ? {}
      : { has: z.strictObject(createPreviewShape(children)).optional() })
  } as EntityShape<This, Path>) as z.ZodObject<EntityShape<This, Path>>;
}

export type EntityOf<This extends Kind, Path extends readonly Kind[] = []> = z.infer<
  (typeof entityBaseSchemas)[This]
> &
  (This extends typeof Descriptors.PAGE
    ? unknown
    : z.infer<
        z.ZodObject<{ has: z.ZodOptional<z.ZodObject<PreviewShape<ChildKinds<This, Path>>>> }>
      >);
export const MagazineSchema = createEntitySchema(Descriptors.MAGAZINE);
export const ReleaseSchema = createEntitySchema(Descriptors.RELEASE);
export const SeriesSchema = createEntitySchema(Descriptors.SERIES);
export const ChapterSchema = createEntitySchema(Descriptors.CHAPTER);
export const PageSchema = createEntitySchema(Descriptors.PAGE);
export type Magazine = z.infer<typeof MagazineSchema>;
export type Release = z.infer<typeof ReleaseSchema>;
export type Series = z.infer<typeof SeriesSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Page = z.infer<typeof PageSchema>;

export const AnyPreviewSchema = z.discriminatedUnion('kind', [
  MagazinePreviewSchema,
  ReleasePreviewSchema,
  SeriesPreviewSchema,
  ChapterPreviewSchema,
  PagePreviewSchema
]);
export const AnyEntitySchema = z.discriminatedUnion('kind', [
  MagazineSchema,
  ReleaseSchema,
  SeriesSchema,
  ChapterSchema,
  PageSchema
]);
export type AnyPreview = z.infer<typeof AnyPreviewSchema>;
export type AnyEntity = z.infer<typeof AnyEntitySchema>;

type ContextShape<Path extends readonly Kind[]> = {
  _parents: z.ZodType<{ -readonly [I in keyof Path]: EntityOf<Path[I]> }>;
} & { [K in Path[number]]: ReturnType<typeof createEntitySchema<K>> };

export function createContextSchema<const Path extends readonly Kind[]>(
  path: Path
): z.ZodType<ContextOf<Path>, ContextOf<Path>> {
  const parents = path.map((kind) => createEntitySchema(kind));
  return z.strictObject({
    _parents: parents.length ? z.tuple([parents[0], ...parents.slice(1)]) : z.tuple([]),
    ...Object.fromEntries(path.map((kind) => [kind, createEntitySchema(kind)]))
  } as unknown as ContextShape<Path>) as z.ZodType<ContextOf<Path>, ContextOf<Path>>;
}
export type ContextOf<Path extends readonly Kind[] = []> = {
  _parents: z.infer<ContextShape<Path>['_parents']>;
} & { [K in Path[number]]: EntityOf<K> };

// Infer the operation signatures from their argument and result schemas.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDescriptorOpsSchema<This extends Kind, const Path extends readonly Kind[]>(
  kind: This,
  path: Path
) {
  const context = createContextSchema(path);
  const entity = createEntitySchema(kind, path);
  const previews = previewSchemas[kind].array();
  const operations = {
    parseUrl: z
      .function({
        input: [context, z.instanceof(URL)],
        output: z.promise(entity.optional())
      })
      .optional(),
    search: z.function({ input: [context, z.string()], output: z.promise(previews) }).optional(),
    get: z.function({ input: [context, z.string()], output: z.promise(entity) }).optional()
  };
  const suggestions = z.function({ input: [], output: z.promise(previews) }).optional();
  return z.strictObject({
    ...operations,
    ...(path.length === 0 ? { suggestions } : {})
  } as typeof operations &
    (Path extends readonly [] ? { suggestions: typeof suggestions } : unknown));
}

type DescriptorShape<This extends Kind, Path extends readonly Kind[]> = {
  _do: ReturnType<typeof createDescriptorOpsSchema<This, Path>>;
} & (This extends typeof Descriptors.PAGE
  ? Record<never, never>
  : {
      [K in ChildKinds<This, Path>]: z.ZodOptional<
        z.ZodObject<DescriptorShape<K, [...Path, This]>>
      >;
    });

export function createDescriptorSchema<This extends Kind, const Path extends readonly Kind[] = []>(
  kind: This,
  path: Path = [] as unknown as Path
): z.ZodObject<DescriptorShape<This, Path>> {
  const children =
    kind === Descriptors.PAGE
      ? []
      : KindSchema.options.filter((child) => child !== kind && !path.includes(child));
  return z.strictObject({
    _do: createDescriptorOpsSchema(kind, path),
    ...Object.fromEntries(
      children.map((child) => [child, createDescriptorSchema(child, [...path, kind]).optional()])
    )
  } as DescriptorShape<This, Path>) as z.ZodObject<DescriptorShape<This, Path>>;
}

export const MagazineDescriptorSchema = createDescriptorSchema(Descriptors.MAGAZINE);
export const ReleaseDescriptorSchema = createDescriptorSchema(Descriptors.RELEASE);
export const SeriesDescriptorSchema = createDescriptorSchema(Descriptors.SERIES);
export const ChapterDescriptorSchema = createDescriptorSchema(Descriptors.CHAPTER);
export const PageDescriptorSchema = createDescriptorSchema(Descriptors.PAGE);
export type MagazineDescriptor = z.infer<typeof MagazineDescriptorSchema>;
export type ReleaseDescriptor = z.infer<typeof ReleaseDescriptorSchema>;
export type SeriesDescriptor = z.infer<typeof SeriesDescriptorSchema>;
export type ChapterDescriptor = z.infer<typeof ChapterDescriptorSchema>;
export type PageDescriptor = z.infer<typeof PageDescriptorSchema>;

export const PluginMetadataSchema = z.object({
  name: z.string(),
  language: z.enum(ISO6391.getAllCodes())
});
export const PluginSchema = PluginMetadataSchema.extend({
  descriptors: z.strictObject({
    magazine: MagazineDescriptorSchema.optional(),
    release: ReleaseDescriptorSchema.optional(),
    series: SeriesDescriptorSchema.optional(),
    chapter: ChapterDescriptorSchema.optional(),
    page: PageDescriptorSchema.optional()
  })
});
export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;
export type Plugin = z.infer<typeof PluginSchema>;
