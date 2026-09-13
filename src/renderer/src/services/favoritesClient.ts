import type { FavoriteIdentity, FavoriteInput } from '@shared/favoriteTypes';
import { invoke } from './ipcClient';

export const favoritesClient = {
  list: () => invoke('favorites:list'),
  add: (favorite: FavoriteInput) => invoke('favorites:add', favorite),
  remove: (identity: FavoriteIdentity) => invoke('favorites:remove', identity)
};
