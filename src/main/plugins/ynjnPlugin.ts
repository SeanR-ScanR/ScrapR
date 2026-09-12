import type { EntityOf, Plugin, PreviewOf } from '@shared/pluginTypes';
import { Descriptors } from '@shared/pluginTypes';
import axios from 'axios';
import { z } from 'zod';

const aFetch = axios.create({
  baseURL: 'https://webapi.ynjn.jp'
});

const idSchema = z.union([z.string(), z.number()]).transform(String);
const titleSchema = z.object({ id: idSchema, name: z.string() });
const titlesResponseSchema = z.object({
  data: z.object({ titles: z.array(titleSchema) })
});
const mangaPageSchema = z.object({
  page_id: idSchema,
  page_image_url: z.url({ protocol: /^https?$/ })
});

const chapterPagesCache = new Map<PreviewOf<'chapter'>['id'], z.infer<typeof mangaPageSchema>[]>();

function matchUrl(url: URL): { magazineId?: string; chapterId?: string } | undefined {
  if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== 'ynjn.jp' || url.port)
    return undefined;
  const match = /^\/(title|viewer)\/([1-9]\d*)(?:\/([1-9]\d*))?\/?$/.exec(url.pathname);
  if (match) return { magazineId: match[2], chapterId: match[3] };
  const chapter = /^\/episode\/([1-9]\d*)\/?$/.exec(url.pathname);
  return chapter ? { chapterId: chapter[1] } : undefined;
}

async function fetchMagazine(id: string): Promise<EntityOf<'magazine'>> {
  const globalRes = z
    .object({
      data: z.object({
        book: z.object({ title_id: idSchema, name: z.string(), summary: z.string() })
      })
    })
    .parse((await aFetch.get<unknown>('/book/' + id)).data).data.book;
  const chaptersRes = z
    .object({
      data: z.object({ episodes: z.array(titleSchema) })
    })
    .parse(
      (
        await aFetch.get<unknown>('/title/' + id + '/episode', {
          params: { isGetAll: true }
        })
      ).data
    ).data.episodes;
  return {
    kind: Descriptors.MAGAZINE,
    id: globalRes.title_id,
    title: globalRes.name,
    description: globalRes.summary,
    has: {
      chapter: chaptersRes.map((e) => ({ kind: Descriptors.CHAPTER, id: e.id, title: e.name }))
    }
  };
}

async function fetchChapterEntity(
  magazineId: string,
  id: string
): Promise<EntityOf<'chapter', ['magazine']>> {
  const { navigation, pages } = await fetchChapter(magazineId, id);
  return {
    kind: Descriptors.CHAPTER,
    id: navigation.id,
    title: navigation.name,
    description: navigation.share_text,
    has: { page: pages.map((p) => ({ kind: Descriptors.PAGE, id: p.page_id })) }
  };
}

async function fetchChapter(
  magazineId: PreviewOf<'magazine'>['id'],
  chapterId: PreviewOf<'chapter'>['id']
): Promise<{
  navigation: z.infer<typeof titleSchema> & { share_text: string };
  pages: z.infer<typeof mangaPageSchema>[];
}> {
  const res = z
    .object({
      data: z.object({
        viewer_navigation: titleSchema.extend({ share_text: z.string() }),
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
  chapterPagesCache.set(chapterId, pages);
  chapterPagesCache.set(res.viewer_navigation.id, pages);
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
              const apiRes = await aFetch.get<unknown>(
                '/title/category/TEXT',
                {
                  params: {
                    category: 'TEXT',
                    page: 1,
                    sort: 'POPULARITY',
                    text: query
                  }
                }
              );
              const res = titlesResponseSchema
                .parse(apiRes.data)
                .data.titles.map((t): PreviewOf<'magazine'> => ({
                  kind: Descriptors.MAGAZINE,
                  id: t.id,
                  title: t.name
                }));
              console.log(res);
              return res;
            },
            get: async (_, id) => fetchMagazine(id),
            suggestions: async () => {
              const apiRes = await aFetch.get<unknown>('/title/feature', {
                params: {
                  displayLocation: 'TOP_PAGE_5',
                  page: 1
                }
              });
              const res = titlesResponseSchema
                .parse(apiRes.data)
                .data.titles.map((t): PreviewOf<'magazine'> => ({
                  kind: Descriptors.MAGAZINE,
                  id: t.id,
                  title: t.name
                }));
              console.log(res);
              return res;
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
                    (
                      await aFetch.get<unknown>(
                        `/episode/${match!.chapterId!}/action_sheet`
                      )
                    ).data
                  ).data.action_sheet;
                const magazine = await fetchMagazine(magazineId);
                return {
                  parents: [magazine],
                  entity: await fetchChapterEntity(magazineId, match!.chapterId!)
                };
              },
              get: async (context, id) => fetchChapterEntity(context.magazine.id, id)
            },
            page: {
              _do: {
                get: async (context, id) => {
                  const pages =
                    chapterPagesCache.get(context.chapter.id) ??
                    (await fetchChapter(context.magazine.id, context.chapter.id)).pages;
                  const rawPageData = pages.find((p) => p.page_id === id);
                  console.log(rawPageData);
                  const res = z
                    .object({
                      data: z.instanceof(Buffer),
                      headers: z.object({
                        'content-type': z.string().optional()
                      })
                    })
                    .parse(
                      await aFetch.get<unknown>(rawPageData!.page_image_url, {
                        responseType: 'arraybuffer'
                      })
                    );
                  const contentType = res.headers['content-type'];
                  const base64 = res.data.toString('base64');

                  return {
                    kind: Descriptors.PAGE,
                    id: id,
                    dataUri: `data:${contentType};base64,${base64}`
                  };
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
