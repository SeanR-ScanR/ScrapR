import type ElectronStore from 'electron-store';
import { z } from 'zod';
import { favoriteKey, FavoriteSchema, FavoriteThumbnailSchema } from '@shared/favoriteTypes';
import internalPluginRepository from '../plugins/internalPluginRepository';
import { getDescriptorResource } from '../utils/descriptorUtils';
import { resolveSource } from '../utils/sourceUtils';
import { handle } from './handle';

const FavoritesDocumentSchema = z.strictObject({
  version: z.literal(1),
  records: FavoriteSchema.array()
});
type FavoritesDocument = z.infer<typeof FavoritesDocumentSchema>;

let storePromise: Promise<ElectronStore<FavoritesDocument>> | undefined;

function getStore(): Promise<ElectronStore<FavoritesDocument>> {
  return (storePromise ??= import('electron-store').then(
    ({ default: Store }) =>
      new Store<FavoritesDocument>({
        name: 'favorites',
        defaults: { version: 1, records: [] },
        clearInvalidConfig: false,
        deserialize: (text) => FavoritesDocumentSchema.parse(JSON.parse(text)),
        serialize: (document) => JSON.stringify(FavoritesDocumentSchema.parse(document))
      })
  ));
}

export function registerFavoritesHandlers(): void {
  handle('favorites:list', async () => {
    const store = await getStore();
    return FavoritesDocumentSchema.parse(store.store).records;
  });

  handle('favorites:add', async (input) => {
    const source = resolveSource(input.pluginId, input.sourceId, internalPluginRepository);
    const detail = await getDescriptorResource(source, input.parents, input.kind, input.id);
    const parents = input.parents.map(({ kind, id }) => ({ kind, id }));
    const identity = {
      pluginId: input.pluginId,
      sourceId: input.sourceId,
      resource: [...parents, { kind: detail.kind, id: detail.id }]
    };
    const alias = [...parents, { kind: input.kind, id: input.id }];
    let thumbnail: z.infer<typeof FavoriteThumbnailSchema> | undefined;
    try {
      thumbnail = FavoriteThumbnailSchema.safeParse(detail.thumbnail).data;
    } catch {
    }
    const store = await getStore();
    const document = FavoritesDocumentSchema.parse(store.store);
    const key = favoriteKey(identity);
    const index = document.records.findIndex((record) => favoriteKey(record) === key);
    const existing = document.records[index];
    const aliases = existing?.aliases.slice() ?? [];
    const aliasKey = favoriteKey({ ...identity, resource: alias });
    if (!aliases.some((resource) => favoriteKey({ ...identity, resource }) === aliasKey)) {
      aliases.push(alias);
    }
    const record = FavoriteSchema.parse({
      ...identity,
      title: 'title' in detail ? detail.title : `Page ${detail.id}`,
      description: 'description' in detail ? detail.description : undefined,
      date: 'date' in detail ? detail.date : undefined,
      thumbnail,
      origin: input.origin,
      addedAt: existing?.addedAt ?? Date.now(),
      aliases
    });
    if (index === -1) {
      document.records.push(record);
    } else {
      document.records[index] = record;
    }
    store.store = FavoritesDocumentSchema.parse(document);
    return FavoritesDocumentSchema.parse(store.store).records;
  });

  handle('favorites:remove', async (identity) => {
    const store = await getStore();
    const document = FavoritesDocumentSchema.parse(store.store);
    const key = favoriteKey(identity);
    document.records = document.records.filter(
      (record) =>
        favoriteKey(record) !== key &&
        !record.aliases.some((resource) => favoriteKey({ ...record, resource }) === key)
    );
    store.store = FavoritesDocumentSchema.parse(document);
    return FavoritesDocumentSchema.parse(store.store).records;
  });
}
