import ISO6391 from 'iso-639-1';
import { z } from 'zod';

export const Descriptors = {
  MAGAZINE: 'magazine', // Un magazine
  RELEASE: 'release', // Une parution du magazine

  MANGA: 'manga', // Un manga
  VOLUME: 'volume', // Le tome d'un manga

  CHAPTER: 'chapter', // Le chapitre
  PAGE: 'page' // Une page
} as const;

export const DescriptorKindSchema = z.enum(Descriptors);
export type DescriptorKind = z.infer<typeof DescriptorKindSchema>;

export const ThumbnailMetadataSchema = z.strictObject({
  key: z.string().min(1),
  payload: z.any()
});
export type ThumbnailMetadata = z.infer<typeof ThumbnailMetadataSchema>;

export const ThumbnailSchema = z.union([
  ThumbnailMetadataSchema,
  z.url({ protocol: /^data$/ }).refine((value) => /^data:image\//i.test(value), {
    message: 'Thumbnail data URI must contain an image'
  })
]);
export type Thumbnail = z.infer<typeof ThumbnailSchema>;

export const ThumbnailDataSchema = z.object({
  bytes: z.instanceof(Uint8Array),
  contentType: z.string().regex(/^image\//i)
});
export type ThumbnailData = z.infer<typeof ThumbnailDataSchema>;
export type ThumbnailSource = { pluginId: string; sourceId: string; path: DescriptorPath };

export class ThumbnailPriority extends EventTarget {
  constructor(public value: number) {
    super();
  }

  update(value: number): void {
    if (this.value === value) return;
    this.value = value;
    this.dispatchEvent(new Event('change'));
  }
}

const previewShape = { id: z.string(), thumbnail: ThumbnailSchema.optional() };
const titledPreviewShape = { ...previewShape, title: z.string() };
const descriptionShape = { description: z.string() };
const descriptorDefinitions = {
  [Descriptors.MAGAZINE]: {
    preview: titledPreviewShape,
    entity: descriptionShape,
    terminal: false
  },
  [Descriptors.RELEASE]: {
    preview: { ...titledPreviewShape, date: z.string() },
    entity: descriptionShape,
    terminal: false
  },
  [Descriptors.MANGA]: { preview: titledPreviewShape, entity: descriptionShape, terminal: false },
  [Descriptors.VOLUME]: { preview: titledPreviewShape, entity: descriptionShape, terminal: false },
  [Descriptors.CHAPTER]: { preview: titledPreviewShape, entity: descriptionShape, terminal: false },
  [Descriptors.PAGE]: {
    preview: previewShape,
    entity: { dataUri: z.url() },
    terminal: true
  }
} as const satisfies Record<
  DescriptorKind,
  { preview: z.ZodRawShape; entity: z.ZodRawShape; terminal: boolean }
>;

type DescriptorDefinitions = typeof descriptorDefinitions;
type TerminalKind = typeof Descriptors.PAGE;

function mapDescriptorSchemas<Schemas extends Record<DescriptorKind, z.ZodType>>(
  create: (kind: DescriptorKind) => z.ZodType
): Schemas {
  return Object.fromEntries(
    DescriptorKindSchema.options.map((kind) => [kind, create(kind)])
  ) as Schemas;
}

type SchemaShape<Shape> = { [K in keyof Shape]: Extract<Shape[K], z.ZodType> };
type PreviewSchemas = {
  [K in DescriptorKind]: z.ZodObject<
    SchemaShape<DescriptorDefinitions[K]['preview'] & { kind: z.ZodLiteral<K> }>
  >;
};
export const PreviewSchemas = mapDescriptorSchemas<PreviewSchemas>((kind) =>
  z.object({ ...descriptorDefinitions[kind].preview, kind: z.literal(kind) })
);
export type PreviewOf<Kind extends DescriptorKind = DescriptorKind> = z.infer<PreviewSchemas[Kind]>;

type EntityBaseSchemas = {
  [K in DescriptorKind]: z.ZodObject<
    SchemaShape<PreviewSchemas[K]['shape'] & DescriptorDefinitions[K]['entity']>
  >;
};
const entityBaseSchemas = mapDescriptorSchemas<EntityBaseSchemas>((kind) =>
  z.object({ ...PreviewSchemas[kind].shape, ...descriptorDefinitions[kind].entity })
);

type ChildKinds<This extends DescriptorKind, Path extends readonly DescriptorKind[]> = Exclude<
  DescriptorKind,
  This | Path[number]
>;

export type ParentPath<Parents extends readonly AnyEntity[]> = {
  [I in keyof Parents]: Parents[I]['kind'];
};

export function getParentPath<const Parents extends readonly AnyEntity[]>(
  parents: Parents
): ParentPath<Parents> {
  return parents.map((parent) => parent.kind) as ParentPath<Parents>;
}

export function createResourceSchema<
  Kind extends DescriptorKind,
  const Parents extends readonly AnyEntity[]
>(kind: Kind, parents: Parents): EntitySchema<Kind, ParentPath<Parents>> {
  return createEntitySchema(kind, getParentPath(parents));
}

type DescriptorPaths<
  This extends DescriptorKind = DescriptorKind,
  Path extends DescriptorKind[] = []
> = {
  [K in This]:
    | [...Path, K]
    | (K extends TerminalKind ? never : DescriptorPaths<ChildKinds<K, Path>, [...Path, K]>);
}[This];

export type DescriptorPath = DescriptorPaths;

const AncestorPathSchema = DescriptorKindSchema.array().superRefine((path, ctx) => {
  const seen = new Set<DescriptorKind>();
  path.forEach((kind, index) => {
    if (seen.has(kind)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Descriptor kinds cannot repeat in a path',
        path: [index]
      });
    }
    if (descriptorDefinitions[kind].terminal && index !== path.length - 1) {
      ctx.addIssue({
        code: 'custom',
        message: `${kind[0].toUpperCase()}${kind.slice(1)} must be the last descriptor in a path`,
        path: [index]
      });
    }
    seen.add(kind);
  });
});

export const DescriptorPathSchema: z.ZodType<DescriptorPath, DescriptorKind[]> =
  AncestorPathSchema.nonempty().transform((path): DescriptorPath => path as DescriptorPath);

function getChildKinds(kind: DescriptorKind, path: readonly DescriptorKind[]): DescriptorKind[] {
  return descriptorDefinitions[kind].terminal
    ? []
    : DescriptorKindSchema.options.filter((child) => child !== kind && !path.includes(child));
}

type PreviewShape<Keys extends DescriptorKind> = {
  [K in Keys]: z.ZodOptional<z.ZodArray<PreviewSchemas[K]>>;
};

function createPreviewShape<Keys extends DescriptorKind>(
  kinds: readonly Keys[]
): PreviewShape<Keys> {
  return Object.fromEntries(
    kinds.map((kind) => [kind, PreviewSchemas[kind].array().optional()])
  ) as PreviewShape<Keys>;
}

export const SuggestionsSchema = z.strictObject(createPreviewShape(DescriptorKindSchema.options));
export type Suggestions = z.infer<typeof SuggestionsSchema>;

type EntityShape<
  This extends DescriptorKind,
  Path extends readonly DescriptorKind[]
> = (typeof entityBaseSchemas)[This]['shape'] &
  (This extends TerminalKind
    ? Record<never, never>
    : {
        has: z.ZodOptional<
          z.ZodObject<
            PreviewShape<ChildKinds<This, number extends Path['length'] ? [] : Path>>,
            z.core.$strict
          >
        >;
      });

type EntitySchema<
  This extends DescriptorKind,
  Path extends readonly DescriptorKind[]
> = This extends DescriptorKind ? z.ZodObject<EntityShape<This, Path>, z.core.$strict> : never;

export function createEntitySchema<This extends DescriptorKind>(kind: This): EntitySchema<This, []>;
export function createEntitySchema<
  This extends DescriptorKind,
  const Path extends readonly DescriptorKind[]
>(kind: This, path: Path): EntitySchema<This, Path>;
export function createEntitySchema(
  kind: DescriptorKind,
  path: readonly DescriptorKind[] = []
): z.ZodObject {
  DescriptorPathSchema.parse([...path, kind]);
  const children = getChildKinds(kind, path);
  return z.strictObject({
    ...entityBaseSchemas[kind].shape,
    ...(descriptorDefinitions[kind].terminal
      ? {}
      : { has: z.strictObject(createPreviewShape(children)).optional() })
  });
}

export type EntityOf<
  This extends DescriptorKind = DescriptorKind,
  Path extends readonly DescriptorKind[] = []
> = z.infer<EntitySchema<This, Path>>;
export const EntitySchemas = mapDescriptorSchemas<{
  [K in DescriptorKind]: EntitySchema<K, []>;
}>((kind) => createEntitySchema(kind));

function descriptorSchemaValues<Schemas extends Record<DescriptorKind, z.ZodType>>(
  schemas: Schemas
): [Schemas[DescriptorKind], ...Schemas[DescriptorKind][]] {
  return Object.values(schemas) as [Schemas[DescriptorKind], ...Schemas[DescriptorKind][]];
}

export const AnyPreviewSchema = z.discriminatedUnion(
  'kind',
  descriptorSchemaValues(PreviewSchemas)
);
export const AnyEntitySchema = z.discriminatedUnion('kind', descriptorSchemaValues(EntitySchemas));
export type AnyPreview = z.infer<typeof AnyPreviewSchema>;
export type AnyEntity = z.infer<typeof AnyEntitySchema>;

export const UrlDiscoveryScopeSchema = z.strictObject({
  pluginId: z.string(),
  sourceId: z.string().optional()
});
export type UrlDiscoveryScope = z.infer<typeof UrlDiscoveryScopeSchema>;
export const UrlDiscoveryResultSchema = z.strictObject({
  matches: z.array(
    z.strictObject({
      pluginId: z.string(),
      sourceId: z.string(),
      pluginName: z.string(),
      sourceName: z.string(),
      path: DescriptorPathSchema
    })
  ),
  errors: z.string().array()
});
export type UrlDiscoveryResult = z.infer<typeof UrlDiscoveryResultSchema>;
export type UrlParseResult = { parents: AnyEntity[]; entity: AnyEntity };

export function createUrlParseResultSchema(path: DescriptorPath): z.ZodType<UrlParseResult> {
  const parsedPath = DescriptorPathSchema.parse(path);
  const ancestors = parsedPath.slice(0, -1);
  return z.strictObject({
    parents: AnyEntitySchema.array()
      .length(ancestors.length)
      .superRefine((parents, ctx) => {
        ancestors.forEach((kind, index) => {
          const result = createEntitySchema(kind, ancestors.slice(0, index)).safeParse(
            parents[index]
          );
          if (!result.success) {
            for (const issue of result.error.issues) {
              ctx.addIssue({ ...issue, path: [index, ...issue.path] });
            }
          }
        });
      }),
    entity: createEntitySchema(parsedPath[parsedPath.length - 1], ancestors)
  });
}

type ContextShape<Path extends readonly DescriptorKind[]> = {
  _parents: z.ZodType<{ -readonly [I in keyof Path]: EntityOf<Path[I]> }>;
} & { [K in Path[number]]: EntitySchema<K, []> };

export function createContextSchema<const Path extends readonly DescriptorKind[]>(
  path: Path
): z.ZodType<ContextOf<Path>, ContextOf<Path>> {
  AncestorPathSchema.parse(path);
  const entries = path.map((kind) => [kind, EntitySchemas[kind]] as const);
  const parents = entries.map(([, schema]) => schema);
  return z.strictObject({
    _parents: parents.length ? z.tuple([parents[0], ...parents.slice(1)]) : z.tuple([]),
    ...Object.fromEntries(entries)
  } as unknown as ContextShape<Path>) as z.ZodType<ContextOf<Path>, ContextOf<Path>>;
}

export type ContextOf<Path extends readonly DescriptorKind[] = []> = z.infer<
  z.ZodObject<ContextShape<Path>, z.core.$strict>
>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve inferred operation schemas and conditional root suggestions.
function createDescriptorOpsSchema<
  This extends DescriptorKind,
  const Path extends readonly DescriptorKind[]
>(kind: This, path: Path) {
  const context = createContextSchema(path);
  const entity = createEntitySchema(kind, path);
  const previews = PreviewSchemas[kind].array();
  const operations = {
    loadThumbnail: z
      .function({
        input: [
          z.any(),
          z.object({ signal: z.instanceof(AbortSignal), priority: z.instanceof(ThumbnailPriority) })
        ],
        output: z.promise(ThumbnailDataSchema)
      })
      .optional(),
    canParseUrl: z
      .function({ input: [z.instanceof(URL)], output: z.promise(z.boolean()) })
      .optional(),
    parseUrl: z
      .function({
        input: [z.instanceof(URL)],
        output: z.promise(createUrlParseResultSchema(DescriptorPathSchema.parse([...path, kind])))
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

type DescriptorShape<This extends DescriptorKind, Path extends readonly DescriptorKind[]> = {
  _do: ReturnType<typeof createDescriptorOpsSchema<This, Path>>;
} & (This extends TerminalKind
  ? Record<never, never>
  : {
      [K in ChildKinds<This, Path>]: z.ZodOptional<
        z.ZodObject<DescriptorShape<K, [...Path, This]>, z.core.$strict>
      >;
    });

type DescriptorSchema<
  This extends DescriptorKind,
  Path extends readonly DescriptorKind[]
> = This extends DescriptorKind ? z.ZodObject<DescriptorShape<This, Path>, z.core.$strict> : never;

export function createDescriptorSchema<This extends DescriptorKind>(
  kind: This
): DescriptorSchema<This, []>;
export function createDescriptorSchema<
  This extends DescriptorKind,
  const Path extends readonly DescriptorKind[]
>(kind: This, path: Path): DescriptorSchema<This, Path>;
export function createDescriptorSchema(
  kind: DescriptorKind,
  path: readonly DescriptorKind[] = []
): z.ZodObject {
  DescriptorPathSchema.parse([...path, kind]);
  const children = getChildKinds(kind, path);
  return z.strictObject({
    _do: createDescriptorOpsSchema(kind, path),
    ...Object.fromEntries(
      children.map((child) => [child, createDescriptorSchema(child, [...path, kind]).optional()])
    )
  });
}

export type DescriptorOf<
  Kind extends DescriptorKind = DescriptorKind,
  Path extends readonly DescriptorKind[] = []
> = z.infer<DescriptorSchema<Kind, Path>>;

export const DescriptorSchemas = mapDescriptorSchemas<{
  [K in DescriptorKind]: DescriptorSchema<K, []>;
}>((kind) => createDescriptorSchema(kind));

export const DescriptorOperationSchema = createDescriptorOpsSchema(Descriptors.PAGE, []).keyof();
export type DescriptorOperation = z.infer<typeof DescriptorOperationSchema>;

export const DescriptorMetadataSchema = z.strictObject({
  kind: DescriptorKindSchema,
  operations: DescriptorOperationSchema.array()
});
export type DescriptorMetadata = z.infer<typeof DescriptorMetadataSchema>;

const SourceMetadataBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.enum(ISO6391.getAllCodes())
});
export const SourceMetadataSchema = SourceMetadataBaseSchema.extend({
  descriptors: DescriptorMetadataSchema.array()
});
export const SourceSchema = SourceMetadataBaseSchema.extend({
  descriptors: z.strictObject(DescriptorSchemas).partial()
});
export type SourceMetadata = z.infer<typeof SourceMetadataSchema>;
export type Source = z.infer<typeof SourceSchema>;

const PluginMetadataBaseSchema = z.object({
  id: z.string(),
  name: z.string()
});
export const PluginMetadataSchema = PluginMetadataBaseSchema.extend({
  sources: z.array(SourceMetadataSchema)
});
export const PluginSchema = PluginMetadataBaseSchema.extend({
  sources: z.array(SourceSchema).optional()
});
export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;
export type Plugin = z.infer<typeof PluginSchema>;
