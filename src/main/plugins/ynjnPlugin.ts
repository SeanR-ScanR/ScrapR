import type {
  Chapter,
  ChapterPreview,
  Magazine,
  MagazinePreview,
  PagePreview,
  Plugin
} from '@shared/pluginTypes';
import axios from 'axios';
import { z } from 'zod';
import { Descriptors } from '@shared/pluginTypes';

const aFetch = axios.create();

const idSchema = z.union([z.string(), z.number()]).transform(String);
const titleSchema = z.object({ id: idSchema, name: z.string() });
const titlesResponseSchema = z.object({
  data: z.object({ titles: z.array(titleSchema) })
});
const mangaPageSchema = z.object({
  page_id: idSchema,
  page_image_url: z.url({ protocol: /^https?$/ })
});

const chapterPagesCache = new Map<ChapterPreview['id'], z.infer<typeof mangaPageSchema>[]>();

async function fetchChapter(
  magazineId: MagazinePreview['id'],
  chapterId: ChapterPreview['id']
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
        await aFetch.get<unknown>('https://webapi.ynjn.jp/viewer', {
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
  name: 'ynjn',
  language: 'ja',
  descriptors: {
    magazine: {
      _do: {
        search: async (_, query): Promise<MagazinePreview[]> => {
          const apiRes = await aFetch.get<unknown>('https://webapi.ynjn.jp/title/category/TEXT', {
            params: {
              category: 'TEXT',
              page: 1,
              sort: 'POPULARITY',
              text: query
            }
          });
          const res = titlesResponseSchema
            .parse(apiRes.data)
            .data.titles.map((t): MagazinePreview => ({
              kind: Descriptors.MAGAZINE,
              id: t.id,
              title: t.name
            }));
          console.log(res);
          return res;
        },
        get: async (_, id) => {
          const globalRes = z
            .object({
              data: z.object({
                book: z.object({ title_id: idSchema, name: z.string(), summary: z.string() })
              })
            })
            .parse((await aFetch.get<unknown>('https://webapi.ynjn.jp/book/' + id)).data).data.book;
          const chaptersRes = z
            .object({
              data: z.object({ episodes: z.array(titleSchema) })
            })
            .parse(
              (
                await aFetch.get<unknown>('https://webapi.ynjn.jp/title/' + id + '/episode', {
                  params: { isGetAll: true }
                })
              ).data
            ).data.episodes;
          const res: Magazine = {
            kind: Descriptors.MAGAZINE,
            id: globalRes.title_id,
            title: globalRes.name,
            description: globalRes.summary,
            has: {
              chapter: chaptersRes.map((e): ChapterPreview => ({
                kind: Descriptors.CHAPTER,
                id: e.id,
                title: e.name
              }))
            }
          };
          console.log(res);
          return res;
        },
        suggestions: async () => {
          const apiRes = await aFetch.get<unknown>('https://webapi.ynjn.jp/title/feature', {
            params: {
              displayLocation: 'TOP_PAGE_5',
              page: 1
            }
          });
          const res = titlesResponseSchema
            .parse(apiRes.data)
            .data.titles.map((t): MagazinePreview => ({
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
          get: async (context, id): Promise<Chapter> => {
            const { navigation, pages } = await fetchChapter(context.magazine.id, id);
            return {
              kind: Descriptors.CHAPTER,
              id: navigation.id,
              title: navigation.name,
              description: navigation.share_text,
              has: {
                page: pages.map((p): PagePreview => ({
                  kind: Descriptors.PAGE,
                  id: p.page_id
                }))
              }
            };
          }
        },
        page: {
          _do: {
            get: async (context, id) => {
              const pages =
                chapterPagesCache.get(context.chapter.id) ??
                (await fetchChapter(context.magazine.id, context.chapter.id)).pages;
              const rawPageData = pages.find((p) => p.page_id === id);
              if (!rawPageData) {
                throw new Error(`Page ${id} was not found in chapter ${context.chapter.id}`);
              }
              console.log(rawPageData);
              const res = z
                .object({
                  data: z.instanceof(Buffer),
                  headers: z.object({
                    'content-type': z.string().optional()
                  })
                })
                .parse(
                  await aFetch.get<unknown>(rawPageData.page_image_url, {
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
};

export default ynjnPlugin;
