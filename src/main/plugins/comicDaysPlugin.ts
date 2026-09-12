import type { Plugin, SeriesPreview } from '@shared/pluginTypes';
import axios from 'axios';
import { HTMLElement, parse } from 'node-html-parser';
import { Descriptors } from '@shared/pluginGlobals';

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

const aFetch = axios.create();

const comicDaysPlugin: Plugin = {
  name: 'comic-days',
  language: 'ja',
  descriptors: {
    series: {
      _do: {
        search: async (_, query): Promise<SeriesPreview[]> => {
          const apiRes = await aFetch.get(`https://comic-days.com/search?q=${query}`, {
            headers: {
              'user-agent': userAgent
            }
          });
          const resString = apiRes.data;
          const document = parse(resString);
          const seriesHtml: HTMLElement[] = document.querySelectorAll(
            '.search-container .series-list li'
          );
          return seriesHtml.map((t): SeriesPreview => ({
            kind: Descriptors.SERIES,
            id: '0',
            title: t.attributes['data-title']
          }));
        }
      }
    }
  }
};

export default comicDaysPlugin;
