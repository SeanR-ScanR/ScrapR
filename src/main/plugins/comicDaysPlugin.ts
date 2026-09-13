import type { Plugin } from '@shared/pluginTypes';
import { Descriptors } from '@shared/pluginTypes';
import axios from 'axios';
import { HTMLElement, parse } from 'node-html-parser';

const aFetch = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
  }
});

const comicDaysPlugin: Plugin = {
  id: 'comic-days',
  name: 'comic-days',
  sources: [
    {
      id: 'comic-days',
      name: 'comic-days',
      language: 'ja',
      descriptors: {
        manga: {
          _do: {
            search: async (_, query) => {
              const apiRes = await aFetch.get(`https://comic-days.com/search?q=${query}`);
              const resString = apiRes.data;
              const document = parse(resString);
              const seriesHtml: HTMLElement[] = document.querySelectorAll(
                '.search-container .series-list li'
              );
              return seriesHtml.map((t) => ({
                kind: Descriptors.MANGA,
                id: '0',
                title: t.attributes['data-title']
              }));
            }
          }
        }
      }
    }
  ]
};

export default comicDaysPlugin;
