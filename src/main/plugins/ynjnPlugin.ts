import type {
  Chapter,
  ChapterPreview,
  Magazine,
  MagazinePreview,
  PagePreview,
  Plugin
} from './pluginTypes.d.ts';
import axios from 'axios';
import { Descriptors } from './pluginGlobals';

const aFetch = axios.create();

const chapterPagesCache = new Map<ChapterPreview['id'], any[]>();

const ynjnPlugin: Plugin = {
  name: 'ynjn',
  descriptors: {
    magazine: {
      _do: {
        search: async (_, query): Promise<MagazinePreview[]> => {
          const apiRes = await aFetch.get('https://webapi.ynjn.jp/title/category/TEXT', {
            params: {
              category: 'TEXT',
              page: 1,
              sort: 'POPULARITY',
              text: query
            }
          });
          const res = apiRes.data.data.titles.map((t): MagazinePreview => ({
            kind: Descriptors.MAGAZINE,
            id: t.id,
            title: t.name
          }));
          console.log(res);
          return res;
        },
        get: async (_, id) => {
          const globalRes = (await aFetch.get('https://webapi.ynjn.jp/book/' + id)).data.data.book;
          const chaptersRes = (
            await aFetch.get('https://webapi.ynjn.jp/title/' + id + '/episode', {
              params: { isGetAll: true }
            })
          ).data.data.episodes;
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
          const apiRes = await aFetch.get('https://webapi.ynjn.jp/title/feature', {
            params: {
              displayLocation: 'TOP_PAGE_5',
              page: 1
            }
          });
          const res = apiRes.data.data.titles.map((t): MagazinePreview => ({
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
            const res = (
              await aFetch.get('https://webapi.ynjn.jp/viewer', {
                params: {
                  titleId: context.magazine.id,
                  episodeId: id,
                  viewerOnly: 0
                }
              })
            ).data.data;
            chapterPagesCache[res.viewer_navigation.id] = res.pages
              .filter((p) => p.manga_page)
              .map((p) => p.manga_page);
            return {
              kind: Descriptors.CHAPTER,
              id: res.viewer_navigation.id,
              title: res.viewer_navigation.name,
              description: res.viewer_navigation.share_text,
              has: {
                page: chapterPagesCache[res.viewer_navigation.id].map((p): PagePreview => ({
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
              console.log(context, context.chapter.id, chapterPagesCache[context.chapter.id]);
              const rawPageData = chapterPagesCache[context.chapter.id].find(
                (p) => p.page_id === id
              );
              console.log(rawPageData);
              const res = await aFetch.get(rawPageData.page_image_url, {
                responseType: 'arraybuffer'
              });
              const contentType = res.headers['content-type'];
              const base64 = Buffer.from(res.data, 'binary').toString('base64');

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
