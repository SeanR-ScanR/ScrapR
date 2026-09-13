import type { Plugin, ThumbnailData, ThumbnailPriority } from '@shared/pluginTypes';
import { Descriptors, ThumbnailDataSchema } from '@shared/pluginTypes';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { z } from 'zod';
import { PriorityTaskQueue } from '../utils/priorityTaskQueue';

const aFetch = axios.create({
  baseURL: 'https://webapi.ynjn.jp'
});

const imageQueue = new PriorityTaskQueue({ concurrency: 42, defaultPriority: 2 });

async function downloadImage(url: string, signal?: AbortSignal): Promise<ThumbnailData> {
  signal?.throwIfAborted();
  const response = await aFetch.get<unknown>(url, {
    responseType: 'arraybuffer',
    signal,
    maxRedirects: 0
  });
  const bytes = z.instanceof(Uint8Array).parse(response.data);
  const detected = await fileTypeFromBuffer(bytes);
  signal?.throwIfAborted();
  if (!detected?.mime.startsWith('image/')) {
    throw new Error(
      `YNJN response did not contain a supported image (Content-Type: ${response.headers['content-type'] ?? 'missing'}).`
    );
  }
  return ThumbnailDataSchema.parse({ bytes, contentType: detected.mime });
}

function fetchImage(
  url: string,
  signal?: AbortSignal,
  priority?: ThumbnailPriority
): Promise<ThumbnailData> {
  return imageQueue.run(() => downloadImage(url, signal), { signal, priority });
}

async function fetchImageDataUri(url: string): Promise<string> {
  const image = await fetchImage(url);
  return `data:${image.contentType};base64,${Buffer.from(image.bytes).toString('base64')}`;
}

const idSchema = z.union([z.string(), z.number()]).transform(String);
const thumbnailPayloadSchema = z.strictObject({
  url: z.url({ protocol: /^https$/, hostname: /^public\.ynjn\.jp$/ }).refine((value) => {
    const url = URL.parse(value);
    return url !== null && !url.username && !url.password && !url.port;
  }, 'Thumbnail URL must not contain credentials or a non-default port')
});
const imageUrlSchema = thumbnailPayloadSchema.shape.url.optional().catch(undefined);
const titleSchema = z.object({ id: idSchema, name: z.string(), image_url: imageUrlSchema });
const episodeSchema = titleSchema.extend({ image_url: imageUrlSchema.nullish() });
const navigationSchema = titleSchema.omit({ image_url: true }).extend({ share_text: z.string() });
const titlesResponseSchema = z.object({
  data: z.object({ titles: z.array(titleSchema) })
});
const mangaPageSchema = z.object({
  page_id: idSchema,
  page_image_url: z.url({ protocol: /^https?$/ })
});

async function fetchEpisodes(magazineId: string): Promise<z.infer<typeof episodeSchema>[]> {
  return z.object({ data: z.object({ episodes: z.array(episodeSchema) }) }).parse(
    (
      await aFetch.get<unknown>(`/title/${magazineId}/episode`, {
        params: { isGetAll: true }
      })
    ).data
  ).data.episodes;
}

function matchUrl(url: URL): { magazineId?: string; chapterId?: string } | undefined {
  if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== 'ynjn.jp' || url.port)
    return undefined;
  const match = /^\/(title|viewer)\/([1-9]\d*)(?:\/([1-9]\d*))?\/?$/.exec(url.pathname);
  if (match) return { magazineId: match[2], chapterId: match[3] };
  const chapter = /^\/episode\/([1-9]\d*)\/?$/.exec(url.pathname);
  return chapter ? { chapterId: chapter[1] } : undefined;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Keep resource return types inferred.
async function fetchMagazine(id: string) {
  const globalRes = z
    .object({
      data: z.object({
        book: z.object({
          title_id: idSchema,
          name: z.string(),
          summary: z.string(),
          image_url: imageUrlSchema
        })
      })
    })
    .parse((await aFetch.get<unknown>('/book/' + id)).data).data.book;
  const chaptersRes = await fetchEpisodes(id);
  return {
    kind: Descriptors.MAGAZINE,
    id: globalRes.title_id,
    title: globalRes.name,
    description: globalRes.summary,
    thumbnail: globalRes.image_url
      ? { key: globalRes.image_url, payload: { url: globalRes.image_url } }
      : undefined,
    has: {
      chapter: chaptersRes.map((e) => ({
        kind: Descriptors.CHAPTER,
        id: e.id,
        title: e.name,
        thumbnail: e.image_url ? { key: e.image_url, payload: { url: e.image_url } } : undefined
      }))
    }
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Keep resource return types inferred.
async function fetchChapterEntity(magazineId: string, id: string) {
  const { navigation, pages } = await fetchChapter(magazineId, id);
  const episode = (await fetchEpisodes(magazineId)).find((e) => e.id === navigation.id);
  return {
    kind: Descriptors.CHAPTER,
    id: navigation.id,
    title: navigation.name,
    description: navigation.share_text,
    thumbnail: episode?.image_url
      ? { key: episode.image_url, payload: { url: episode.image_url } }
      : undefined,
    has: {
      page: pages.map((p) => ({
        kind: Descriptors.PAGE,
        id: p.page_id,
        thumbnail: { key: p.page_image_url, payload: { url: p.page_image_url } }
      }))
    }
  };
}

async function fetchChapter(
  magazineId: string,
  chapterId: string
): Promise<{
  navigation: z.infer<typeof navigationSchema>;
  pages: z.infer<typeof mangaPageSchema>[];
}> {
  const res = z
    .object({
      data: z.object({
        viewer_navigation: navigationSchema,
        pages: z.array(z.object({ manga_page: mangaPageSchema.nullish() }))
      })
    })
    .parse(
      (
        await aFetch.get<unknown>('/viewer', {
          params: {
            titleId: magazineId,
            episodeId: chapterId,
            viewerOnly: 0
          }
        })
      ).data
    ).data;
  const pages = res.pages.flatMap((p) => (p.manga_page ? [p.manga_page] : []));
  return { navigation: res.viewer_navigation, pages };
}

const ynjnPlugin: Plugin = {
  id: 'ynjn',
  name: 'ynjn',
  sources: [
    {
      id: 'ynjn',
      name: 'ynjn',
      language: 'ja',
      descriptors: {
        magazine: {
          _do: {
            canParseUrl: async (url) => {
              const match = matchUrl(url);
              return !!match?.magazineId && !match.chapterId && url.pathname.startsWith('/title/');
            },
            parseUrl: async (url) => {
              const match = matchUrl(url);
              return { parents: [], entity: await fetchMagazine(match!.magazineId!) };
            },
            search: async (_, query) => {
              const apiRes = await aFetch.get<unknown>('/title/category/TEXT', {
                params: {
                  category: 'TEXT',
                  page: 1,
                  sort: 'POPULARITY',
                  text: query
                }
              });
              return titlesResponseSchema.parse(apiRes.data).data.titles.map((t) => ({
                kind: Descriptors.MAGAZINE,
                id: t.id,
                title: t.name,
                thumbnail: t.image_url
                  ? { key: t.image_url, payload: { url: t.image_url } }
                  : undefined
              }));
            },
            get: async (_, id) => fetchMagazine(id),
            suggestions: async () => {
              const apiRes = await aFetch.get<unknown>('/title/feature', {
                params: {
                  displayLocation: 'TOP_PAGE_5',
                  page: 1
                }
              });
              return titlesResponseSchema.parse(apiRes.data).data.titles.map((t) => ({
                kind: Descriptors.MAGAZINE,
                id: t.id,
                title: t.name,
                thumbnail: t.image_url
                  ? { key: t.image_url, payload: { url: t.image_url } }
                  : undefined
              }));
            },
            loadThumbnail: async (payload, { signal, priority }) => {
              const { url } = thumbnailPayloadSchema.parse(payload);
              return fetchImage(url, signal, priority);
            }
          },
          chapter: {
            _do: {
              canParseUrl: async (url) => !!matchUrl(url)?.chapterId,
              parseUrl: async (url) => {
                const match = matchUrl(url);
                const { title_id: magazineId } = z
                  .object({
                    data: z.object({ action_sheet: z.object({ title_id: idSchema }) })
                  })
                  .parse(
                    (await aFetch.get<unknown>(`/episode/${match!.chapterId!}/action_sheet`)).data
                  ).data.action_sheet;
                const magazine = await fetchMagazine(magazineId);
                return {
                  parents: [magazine],
                  entity: await fetchChapterEntity(magazineId, match!.chapterId!)
                };
              },
              get: async (context, id) => fetchChapterEntity(context.magazine.id, id),
              loadThumbnail: async (payload, { signal, priority }) => {
                const { url } = thumbnailPayloadSchema.parse(payload);
                return fetchImage(url, signal, priority);
              }
            },
            page: {
              _do: {
                get: async (context, id) => {
                  const { pages } = await fetchChapter(context.magazine.id, context.chapter.id);
                  const rawPageData = pages.find((p) => p.page_id === id);
                  if (!rawPageData) {
                    throw new Error(`Unknown page ID "${id}" in chapter "${context.chapter.id}"`);
                  }
                  const dataUri = await fetchImageDataUri(rawPageData.page_image_url);
                  return {
                    kind: Descriptors.PAGE,
                    id,
                    dataUri,
                    thumbnail: dataUri
                  };
                },
                loadThumbnail: async (payload, { signal, priority }) => {
                  const { url } = thumbnailPayloadSchema.parse(payload);
                  return fetchImage(url, signal, priority);
                }
              }
            }
          }
        }
      }
    }
  ]
};

export default ynjnPlugin;
