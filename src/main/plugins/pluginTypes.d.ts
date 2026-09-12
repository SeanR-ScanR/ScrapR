import { Descriptors } from './pluginGlobals';

export type Kind = (typeof Descriptors)[keyof typeof Descriptors];

type Kinded<K extends Kind> = {
  kind: K;
};

/* =========================================================
 * Preview types
 * =======================================================*/

export type MagazinePreview = Kinded<typeof Descriptors.MAGAZINE> & {
  id: string;
  title: string;
};

export type ReleasePreview = Kinded<typeof Descriptors.RELEASE> & {
  id: string;
  title: string;
  date: string;
};

export type SeriesPreview = Kinded<typeof Descriptors.SERIES> & {
  id: string;
  title: string;
};

export type ChapterPreview = Kinded<typeof Descriptors.CHAPTER> & {
  id: string;
  title: string;
};

export type PagePreview = Kinded<typeof Descriptors.PAGE> & {
  id: string;
};

/* =========================================================
 * Base entity types
 * =======================================================*/

type MagazineBase = MagazinePreview & {
  description: string;
};

type ReleaseBase = ReleasePreview & {
  description: string;
};

type SeriesBase = SeriesPreview & {
  description: string;
};

type ChapterBase = ChapterPreview & {
  description: string;
};

type PageBase = PagePreview & {
  dataUri: string;
};

/* =========================================================
 * Kind maps
 * =======================================================*/

type PreviewMap = {
  [Descriptors.MAGAZINE]: MagazinePreview;
  [Descriptors.RELEASE]: ReleasePreview;
  [Descriptors.SERIES]: SeriesPreview;
  [Descriptors.CHAPTER]: ChapterPreview;
  [Descriptors.PAGE]: PagePreview;
};

type EntityBaseMap = {
  [Descriptors.MAGAZINE]: MagazineBase;
  [Descriptors.RELEASE]: ReleaseBase;
  [Descriptors.SERIES]: SeriesBase;
  [Descriptors.CHAPTER]: ChapterBase;
  [Descriptors.PAGE]: PageBase;
};

/* =========================================================
 * Internal helpers
 * =======================================================*/

type PathKinds<Path extends readonly Kind[]> = Path[number];

type ChildKinds<This extends Kind, Path extends readonly Kind[] = []> = Exclude<
  Kind,
  This | PathKinds<Path>
>;

type HasChildren<This extends Kind, Path extends readonly Kind[] = []> =
  ChildKinds<This, Path> extends never
    ? any
    : {
        has?: Partial<{
          [K in ChildKinds<This, Path>]: PreviewMap[K][];
        }>;
      };

type EntityOf<This extends Kind, Path extends readonly Kind[] = []> = EntityBaseMap[This] &
  (This extends typeof Descriptors.PAGE ? any : HasChildren<This, Path>);

type PathEntities<Path extends readonly Kind[]> = {
  [I in keyof Path]: Path[I] extends Kind ? EntityOf<Path[I]> : never;
};

type ContextEntries<Path extends readonly Kind[]> = {
  [K in Path[number]]: EntityOf<K>;
};

export type ContextOf<Path extends readonly Kind[] = []> = {
  _parents: PathEntities<Path>;
} & ContextEntries<Path>;

type NextPath<Path extends readonly Kind[], This extends Kind> = [...Path, This];

type DescriptorOps<This extends Kind, Path extends readonly Kind[] = []> = {
  _do: {
    parseUrl?: (context: ContextOf<Path>, url: URL) => Promise<EntityOf<This, Path> | undefined>;

    search?: (context: ContextOf<Path>, query: string) => Promise<PreviewMap[This][]>;

    get?: (
      context: ContextOf<Path>,
      id: EntityBaseMap[This]['id']
    ) => Promise<EntityOf<This, Path>>;
  } & (Path extends readonly [] ? { suggestions?: () => Promise<PreviewMap[This][]> } : {});
};

type DescriptorChildren<This extends Kind, Path extends readonly Kind[] = []> = Partial<{
  [K in ChildKinds<This, Path>]: DescriptorOf<K, NextPath<Path, This>>;
}>;

type DescriptorOf<This extends Kind, Path extends readonly Kind[] = []> = DescriptorOps<
  This,
  Path
> &
  (This extends typeof Descriptors.PAGE ? any : DescriptorChildren<This, Path>);

/* =========================================================
 * Public entity types
 * =======================================================*/

export type Magazine = EntityOf<typeof Descriptors.MAGAZINE>;
export type Release = EntityOf<typeof Descriptors.RELEASE>;
export type Series = EntityOf<typeof Descriptors.SERIES>;
export type Chapter = EntityOf<typeof Descriptors.CHAPTER>;
export type Page = EntityOf<typeof Descriptors.PAGE>;

export type AnyPreview = PreviewMap[Kind];
export type AnyEntity = {
  [K in Kind]: EntityOf<K>;
}[Kind];

/* =========================================================
 * Public descriptor types
 * =======================================================*/

export type MagazineDescriptor = DescriptorOf<typeof Descriptors.MAGAZINE>;
export type ReleaseDescriptor = DescriptorOf<typeof Descriptors.RELEASE>;
export type SeriesDescriptor = DescriptorOf<typeof Descriptors.SERIES>;
export type ChapterDescriptor = DescriptorOf<typeof Descriptors.CHAPTER>;
export type PageDescriptor = DescriptorOf<typeof Descriptors.PAGE>;

/* =========================================================
 * Suggestions types
 * =======================================================*/

export type Suggestions = Partial<{
  [K in Kind]: Array<PreviewMap[K]>;
}>;

/* =========================================================
 * Plugin
 * =======================================================*/

export type Plugin = {
  name: string;
  descriptors: Partial<{
    [K in Kind]: DescriptorOf<K>;
  }>;
};
